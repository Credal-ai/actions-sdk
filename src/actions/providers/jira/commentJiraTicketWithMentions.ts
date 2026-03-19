import type {
  AuthParamsType,
  jiraCommentJiraTicketWithMentionsFunction,
  jiraCommentJiraTicketWithMentionsOutputType,
  jiraCommentJiraTicketWithMentionsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";
import { extractMentions, insertMentionNodes } from "./convertMentionsInAdf.js";
import { markdownToAdf } from "marklassian";

const commentJiraTicketWithMentions: jiraCommentJiraTicketWithMentionsFunction = async ({
  params,
  authParams,
}: {
  params: jiraCommentJiraTicketWithMentionsParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCommentJiraTicketWithMentionsOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, isDataCenter } = getJiraApiConfig(authParams);
  const { issueId, comment } = params;

  if (isDataCenter) {
    return {
      success: false,
      error: "commentJiraTicketWithMentions is only supported on Jira Cloud. Use commentJiraTicket for Jira Data Center.",
    };
  }

  try {
    const { sanitized, mentions } = extractMentions(comment);
    const adf = markdownToAdf(sanitized);
    const body = insertMentionNodes(adf, mentions);

    const response = await axiosClient.post(
      `${apiUrl}/issue/${issueId}/comment`,
      { body },
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
    console.error("Error commenting on Jira ticket with mentions: ", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default commentJiraTicketWithMentions;
