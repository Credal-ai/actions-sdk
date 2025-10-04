import type {
  AuthParamsType,
  jiraUpdateJiraTicketDetailsFunction,
  jiraUpdateJiraTicketDetailsOutputType,
  jiraUpdateJiraTicketDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { resolveRequestTypeField, getJiraApiConfig, getErrorMessage } from "./utils.js";

const updateJiraTicketDetails: jiraUpdateJiraTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: jiraUpdateJiraTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraUpdateJiraTicketDetailsOutputType> => {
  const { authToken } = authParams;
  const { issueId, summary, description, customFields, requestTypeId, projectKey } = params;
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const fullApiUrl = `${apiUrl}/issue/${issueId}`;
  const formattedDescription = description ? strategy.formatText(description) : undefined;

  const { field: requestTypeField, message: partialUpdateMessage } = await resolveRequestTypeField(
    requestTypeId,
    projectKey,
    apiUrl,
    authToken,
  );

  const payload = {
    fields: {
      ...(summary && { summary }),
      ...(formattedDescription && { description: formattedDescription }),
      ...(Object.keys(requestTypeField).length > 0 && requestTypeField),
      ...(customFields && customFields),
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
