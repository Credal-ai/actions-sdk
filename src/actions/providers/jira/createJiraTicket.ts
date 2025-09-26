import type {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { resolveAccountIdIfEmail, resolveRequestTypeField, getJiraApiConfig, getErrorMessage } from "./utils.js";

const createJiraTicket: jiraCreateJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCreateJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCreateJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);

  // authToken is guaranteed to exist after getJiraApiConfig succeeds
  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const [reporterId, assigneeId] = await Promise.all([
    resolveAccountIdIfEmail(params.reporter, apiUrl, authToken, strategy),
    resolveAccountIdIfEmail(params.assignee, apiUrl, authToken, strategy),
  ]);

  const { field: requestTypeField, message: partialUpdateMessage } = await resolveRequestTypeField(
    params.requestTypeId,
    params.projectKey,
    apiUrl,
    authToken,
  );

  const reporterAssignment = strategy.formatUserAssignment(reporterId);
  const assigneeAssignment = strategy.formatUserAssignment(assigneeId);

  const payload = {
    fields: {
      project: {
        key: params.projectKey,
      },
      summary: params.summary,
      description: strategy.formatText(params.description),
      issuetype: {
        name: params.issueType,
      },
      ...(reporterAssignment && { reporter: reporterAssignment }),
      ...(assigneeAssignment && { assignee: assigneeAssignment }),
      ...(Object.keys(requestTypeField).length > 0 && requestTypeField),
      ...(params.customFields && params.customFields),
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
