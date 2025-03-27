import {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { getUserAccountIdFromEmail } from "./utils";

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
    reporterId = await getUserAccountIdFromEmail(params.reporter, apiUrl, authToken);
  }

  // If assignee is an email, look up the account ID
  let assigneeId: string | null = null;
  if (params.assignee && typeof params.assignee === "string" && params.assignee.includes("@") && authToken) {
    assigneeId = await getUserAccountIdFromEmail(params.assignee, apiUrl, authToken);
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
