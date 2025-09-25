import type {
  AuthParamsType,
  jiraUpdateJiraTicketDetailsFunction,
  jiraUpdateJiraTicketDetailsOutputType,
  jiraUpdateJiraTicketDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getRequestTypeCustomFieldId, getJiraApiConfig, formatText, getErrorMessage } from "./utils.js";

const updateJiraTicketDetails: jiraUpdateJiraTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: jiraUpdateJiraTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraUpdateJiraTicketDetailsOutputType> => {
  const { authToken } = authParams;
  const { issueId, summary, description, customFields, requestTypeId } = params;
  const { apiUrl, browseUrl, isDataCenter } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const fullApiUrl = `${apiUrl}/issue/${issueId}`;

  const formattedDescription = description ? formatText(description, isDataCenter) : undefined;

  // If request type is provided, find the custom field ID and prepare the value
  const requestTypeField: { [key: string]: string } = {};
  let partialUpdateMessage = "";
  if (requestTypeId && authToken) {
    const result = await getRequestTypeCustomFieldId(params.projectKey, apiUrl, authToken);
    if (result.fieldId) {
      requestTypeField[result.fieldId] = requestTypeId;
    }
    if (result.message) {
      partialUpdateMessage = result.message;
    }
  }

  const payload = {
    fields: {
      ...(summary && { summary }),
      ...(formattedDescription && { description: formattedDescription }),
      ...requestTypeField,
      ...(customFields && { ...customFields }),
    },
  };

  try {
    await axiosClient.put(fullApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });
    return {
      success: true,
      ticketUrl: `${browseUrl}/browse/${issueId}`,
      ...(partialUpdateMessage && { error: partialUpdateMessage }),
    };
  } catch (error: unknown) {
    console.error("Error updating Jira ticket:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default updateJiraTicketDetails;
