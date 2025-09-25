import type {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import {
  resolveAccountIdIfEmail,
  getRequestTypeCustomFieldId,
  getJiraApiConfig,
  formatText,
  createUserAssignmentObject,
  getErrorMessage,
} from "./utils.js";

const createJiraTicket: jiraCreateJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCreateJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCreateJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, isDataCenter } = getJiraApiConfig(authParams);

  // authToken is guaranteed to exist after getJiraApiConfig succeeds
  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const [reporterId, assigneeId] = await Promise.all([
    resolveAccountIdIfEmail(params.reporter, apiUrl, authToken, isDataCenter),
    resolveAccountIdIfEmail(params.assignee, apiUrl, authToken, isDataCenter),
  ]);

  // If request type is provided, find the custom field ID and prepare the value
  const requestTypeField: { [key: string]: string } = {};
  let partialUpdateMessage = "";
  if (params.requestTypeId && authToken) {
    const result = await getRequestTypeCustomFieldId(params.projectKey, apiUrl, authToken);
    if (result.fieldId) {
      requestTypeField[result.fieldId] = params.requestTypeId;
    }
    if (result.message) {
      partialUpdateMessage = result.message;
    }
  }

  // Use different description formats for Data Center (API v2) vs Cloud (API v3)
  const description = formatText(params.description, isDataCenter);

  const payload = {
    fields: {
      project: {
        key: params.projectKey,
      },
      summary: params.summary,
      description: description,
      issuetype: {
        name: params.issueType,
      },
      ...(createUserAssignmentObject(reporterId, isDataCenter)
        ? { reporter: createUserAssignmentObject(reporterId, isDataCenter) }
        : {}),
      ...(createUserAssignmentObject(assigneeId, isDataCenter)
        ? { assignee: createUserAssignmentObject(assigneeId, isDataCenter) }
        : {}),
      ...requestTypeField,
      ...(params.customFields ? params.customFields : {}),
    },
  };
  try {
    const response = await axiosClient.post(`${apiUrl}/issue`, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    const ticketKey = response.data.key;
    if (!ticketKey) {
      // Check if we got HTML instead of JSON (common when auth fails)
      if (typeof response.data === "string" && response.data.includes("<!DOCTYPE html>")) {
        throw new Error(
          "Received HTML response instead of JSON - this usually indicates authentication failed or the server redirected to a login page",
        );
      }
      console.error("No ticket key in response:", JSON.stringify(response.data, null, 2));
      throw new Error("Failed to get ticket key from Jira response");
    }

    return {
      success: true,
      ticketUrl: `${browseUrl}/browse/${ticketKey}`,
      ...(partialUpdateMessage && { error: partialUpdateMessage }),
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default createJiraTicket;
