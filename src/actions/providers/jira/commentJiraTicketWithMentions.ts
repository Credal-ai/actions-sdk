import type {
  AuthParamsType,
  jiraCommentJiraTicketFunction,
  jiraCommentJiraTicketOutputType,
  jiraCommentJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";
import { convertMentionsInAdf } from "./convertMentionsInAdf.js";

const commentJiraTicketWithMentions: jiraCommentJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCommentJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCommentJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, strategy } = getJiraApiConfig(authParams);
  const { issueId, comment } = params;

  try {
    const formatted = strategy.formatText(comment);
    // convertMentionsInAdf only applies to ADF (Cloud). Data Center returns a plain
    // string using wiki-markup, where mention conversion is not applicable.
    const body = typeof formatted === "object" ? convertMentionsInAdf(formatted) : formatted;

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
      // focusedCommentId may not auto-scroll on all Data Center versions/themes
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
