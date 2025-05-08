import type {
  AuthParamsType,
  jiraUpdateJiraTicketDetailsFunction,
  jiraUpdateJiraTicketDetailsOutputType,
  jiraUpdateJiraTicketDetailsParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const updateJiraTicketDetails: jiraUpdateJiraTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: jiraUpdateJiraTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraUpdateJiraTicketDetailsOutputType> => {
  const { authToken, cloudId, baseUrl } = authParams;
  const { issueId, summary, description, customFields } = params;

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

  const payload = {
    fields: {
      ...(summary && { summary }),
      ...(formattedDescription && { description: formattedDescription }),
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
