import { AxiosError } from "axios";
import {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

async function getUserAccountId(
  email: string,
  baseUrl: string,
  authToken: string,
  username: string,
): Promise<string | null> {
  try {
    const response = await axiosClient.get<Array<{ accountId: string; displayName: string; emailAddress: string }>>(
      `${baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/json",
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
  const { authToken, baseUrl, username } = authParams;
  const url = `${baseUrl}/rest/api/3/issue`;

  // If assignee is an email, look up the account ID
  let reporterId: string | null = null;
  if (
    params.reporter &&
    typeof params.reporter === "string" &&
    params.reporter.includes("@") &&
    baseUrl &&
    authToken &&
    username
  ) {
    reporterId = await getUserAccountId(params.reporter, baseUrl, authToken, username);
  }

  // If assignee is an email, look up the account ID
  let assigneeId: string | null = null;
  if (
    params.assignee &&
    typeof params.assignee === "string" &&
    params.assignee.includes("@") &&
    baseUrl &&
    authToken &&
    username
  ) {
    assigneeId = await getUserAccountId(params.assignee, baseUrl, authToken, username);
  }

  const description =
    typeof params.description === "string"
      ? {
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
        }
      : params.description;

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
    },
  };

  const response = await axiosClient.post(url, payload, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });

  return {
    ticketUrl: `${baseUrl}/browse/${response.data.key}`,
  };
};

export default createJiraTicket;
