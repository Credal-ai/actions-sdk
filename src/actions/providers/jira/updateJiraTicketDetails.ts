import type {
  AuthParamsType,
  jiraUpdateJiraTicketDetailsFunction,
  jiraUpdateJiraTicketDetailsOutputType,
  jiraUpdateJiraTicketDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getRequestTypeCustomFieldId } from "./utils.js";

const updateJiraTicketDetails: jiraUpdateJiraTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: jiraUpdateJiraTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraUpdateJiraTicketDetailsOutputType> => {
  const { authToken, cloudId, baseUrl } = authParams;
  const { issueId, summary, description, customFields, requestTypeId } = params;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to comment on Jira ticket");
  }

  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueId}`;

  const formattedDescription = description
    ? {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: description,
              },
            ],
          },
        ],
      }
    : undefined;

  // If request type is provided, find the custom field ID and prepare the value
  const requestTypeField: { [key: string]: string } = {};
  if (requestTypeId && authToken) {
    const requestTypeFieldId = await getRequestTypeCustomFieldId(
      params.projectKey,
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`,
      authToken,
    );
    if (requestTypeFieldId) {
      requestTypeField[requestTypeFieldId] = requestTypeId;
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
    await axiosClient.put(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });
    return {
      ticketUrl: `${baseUrl}/browse/${issueId}`,
    };
  } catch (error) {
    console.error("Error updating Jira ticket:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
};

export default updateJiraTicketDetails;
