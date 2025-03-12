import axios, { AxiosError } from "axios";
import {
  AuthParamsType,
  jiraCreateJiraTicketFunction,
  jiraCreateJiraTicketOutputType,
  jiraCreateJiraTicketParamsType,
} from "../../autogen/types";

async function getUserAccountId(
  email: string,
  baseUrl: string,
  authToken: string,
  username: string,
): Promise<string | null> {
  try {
    const response = await axios.get<Array<{ accountId: string; displayName: string; emailAddress: string }>>(
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
      // ...(params.reporter ? { reporter: { id: params.reporter } } : {}),
    },
  };
  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });
    // Success case
    return {
      ticketUrl: `${baseUrl}/browse/${response.data.key}`,
    };
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // The server responded with a status code outside of 2xx range
      console.error("Jira API error:", axiosError.response.status, axiosError.response.data);
      throw new Error(
        `Failed to create Jira ticket: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
      );
    } else if (axiosError.request) {
      // Request was made but no response received
      console.error("No response from Jira API:", axiosError.request);
      throw new Error("No response received from Jira API");
    } else {
      // Error setting up the request
      console.error("Error creating Jira ticket:", axiosError.message);
      throw new Error(`Error creating Jira ticket: ${axiosError.message}`);
    }
  }
};

export default createJiraTicket;
