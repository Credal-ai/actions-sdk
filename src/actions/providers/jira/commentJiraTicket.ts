import type {
  AuthParamsType,
  jiraCommentJiraTicketFunction,
  jiraCommentJiraTicketOutputType,
  jiraCommentJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient";

const commentJiraTicket: jiraCommentJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCommentJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCommentJiraTicketOutputType> => {
  const { authToken, cloudId, baseUrl } = authParams;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to comment on Jira ticket");
  }
  const apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${params.issueId}/comment`;

  try {
    const response = await axiosClient.post(
      apiUrl,
      {
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: params.comment,
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return {
      success: true,
      commentUrl: `${baseUrl}/browse/${params.issueId}?focusedCommentId=${response.data.id}`,
    };
  } catch (error) {
    console.error("Error commenting on Jira ticket: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default commentJiraTicket;
