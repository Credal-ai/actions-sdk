import type {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { resolveAccountIdIfEmail, getRequestTypeCustomFieldId, getJiraApiConfig } from "./utils.js";

const createJiraTicket: jiraCreateJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCreateJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCreateJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl } = getJiraApiConfig(authParams);

  // authToken is guaranteed to exist after getJiraApiConfig succeeds
  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const [reporterId, assigneeId] = await Promise.all([
    resolveAccountIdIfEmail(params.reporter, apiUrl, authToken),
    resolveAccountIdIfEmail(params.assignee, apiUrl, authToken),
  ]);

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
    ticketUrl: `${browseUrl}/browse/${response.data.key}`,
  };
};

export default createJiraTicket;
