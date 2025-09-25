import type {
  AuthParamsType,
  jiraCommentJiraTicketFunction,
  jiraCommentJiraTicketOutputType,
  jiraCommentJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

const commentJiraTicket: jiraCommentJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCommentJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCommentJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);
  const { issueId, comment } = params;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  try {
    const response = await axiosClient.post(
      `${apiUrl}/issue/${issueId}/comment`,
      {
        body: strategy.formatText(comment),
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
      commentUrl: `${browseUrl}/browse/${issueId}?focusedCommentId=${response.data.id}`,
    };
  } catch (error: unknown) {
    console.error("Error commenting on Jira ticket: ", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default commentJiraTicket;
