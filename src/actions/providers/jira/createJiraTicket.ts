import type {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getUserAccountIdFromEmail, getRequestTypeCustomFieldId } from "./utils.js";

const createJiraTicket: jiraCreateJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCreateJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCreateJiraTicketOutputType> => {
  const { authToken, cloudId, baseUrl } = authParams;

  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/`;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to comment on Jira ticket");
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

  // If request type is provided, find the custom field ID and prepare the value
  const requestTypeField: { [key: string]: string } = {};
  if (params.requestTypeId && authToken) {
    const requestTypeFieldId = await getRequestTypeCustomFieldId(params.projectKey, apiUrl, authToken);
    if (requestTypeFieldId) {
      requestTypeField[requestTypeFieldId] = params.requestTypeId;
    }
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
      ...requestTypeField,
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
