import type {
  AuthParamsType,
  jiraLinkJiraIssuesFunction,
  jiraLinkJiraIssuesOutputType,
  jiraLinkJiraIssuesParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

const linkJiraIssues: jiraLinkJiraIssuesFunction = async ({
  params,
  authParams,
}: {
  params: jiraLinkJiraIssuesParamsType;
  authParams: AuthParamsType;
}): Promise<jiraLinkJiraIssuesOutputType> => {
  const { inwardIssueKey, outwardIssueKey, linkTypeName, comment } = params;
  const { apiUrl, strategy } = getJiraApiConfig(authParams);

  // The issue link endpoint is /rest/api/3/issueLink (Cloud) or /rest/api/2/issueLink (Data Center)
  const issueLinkUrl = `${apiUrl}/issueLink`;

  // Build the request body per the Jira REST API
  // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-links/#api-rest-api-3-issuelink-post
  const payload: Record<string, unknown> = {
    inwardIssue: {
      key: inwardIssueKey,
    },
    outwardIssue: {
      key: outwardIssueKey,
    },
    type: {
      name: linkTypeName,
    },
  };

  if (comment) {
    payload.comment = {
      body: strategy.formatText(comment),
    };
  }

  try {
    await axiosClient.post(issueLinkUrl, payload, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error linking Jira issues:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default linkJiraIssues;
