import type {
  AuthParamsType,
  jiraCommentJiraTicketFunction,
  jiraCommentJiraTicketOutputType,
  jiraCommentJiraTicketParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, formatText, getErrorMessage } from "./utils.js";

const commentJiraTicket: jiraCommentJiraTicketFunction = async ({
  params,
  authParams,
}: {
  params: jiraCommentJiraTicketParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCommentJiraTicketOutputType> => {
  const { authToken } = authParams;
  const { apiUrl, browseUrl, isDataCenter } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  try {
    const response = await axiosClient.post(
      `${apiUrl}/issue/${params.issueId}/comment`,
      {
        body: formatText(params.comment, isDataCenter),
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
      commentUrl: `${browseUrl}/browse/${params.issueId}?focusedCommentId=${response.data.id}`,
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
