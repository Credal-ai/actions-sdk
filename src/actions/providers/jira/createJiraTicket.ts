import { AxiosError } from "axios";
import {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

async function getUserAccountId(email: string, apiUrl: string, authToken: string): Promise<string | null> {
  try {
    const response = await axiosClient.get<Array<{ accountId: string; displayName: string; emailAddress: string }>>(
      `${apiUrl}/user/search?query=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      },
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].accountId;
    }
    return null;
  } catch (error) {
    // Try to complete request without assignee/reporter.
    const axiosError = error as AxiosError;
    console.error("Error finding user:", axiosError.message);
    return null;
  }
}

const createJiraTicket: jiraCreateJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCreateJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCreateJiraTicketOutputType> => {
  const { authToken, cloudId, baseUrl } = authParams;

  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/`;

  if (!cloudId) {
    throw new Error("Cloud ID is required to create a Jira ticket");
  }

  // If assignee is an email, look up the account ID
  let reporterId: string | null = null;
  if (params.reporter && typeof params.reporter === "string" && params.reporter.includes("@") && authToken) {
    reporterId = await getUserAccountId(params.reporter, apiUrl, authToken);
  }

  // If assignee is an email, look up the account ID
  let assigneeId: string | null = null;
  if (params.assignee && typeof params.assignee === "string" && params.assignee.includes("@") && authToken) {
    assigneeId = await getUserAccountId(params.assignee, apiUrl, authToken);
  }

  const description = {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: params.description,
          },
        ],
      },
    ],
  };

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
      ...(reporterId ? { reporter: { id: reporterId } } : {}),
      ...(assigneeId ? { assignee: { id: assigneeId } } : {}),
      ...(params.customFields ? params.customFields : {}),
    },
  };

  const response = await axiosClient.post(`${apiUrl}/issue`, payload, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: "application/json",
    },
  });

  return {
    ticketUrl: `${baseUrl}/browse/${response.data.key}`,
  };
};

export default createJiraTicket;
