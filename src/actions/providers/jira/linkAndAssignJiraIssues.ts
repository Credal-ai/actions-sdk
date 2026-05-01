import type {
  AuthParamsType,
  jiraLinkAndAssignJiraIssuesFunction,
  jiraLinkAndAssignJiraIssuesOutputType,
  jiraLinkAndAssignJiraIssuesParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";
import { log } from "../../../utils/logger.js";

const linkAndAssignJiraIssues: jiraLinkAndAssignJiraIssuesFunction = async ({
  params,
  authParams,
}: {
  params: jiraLinkAndAssignJiraIssuesParamsType;
  authParams: AuthParamsType;
}): Promise<jiraLinkAndAssignJiraIssuesOutputType> => {
  const { inwardIssueKey, outwardIssueKey, linkTypeName, comment } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  const { apiUrl, strategy } = getJiraApiConfig(authParams);

  const headers = {
    Authorization: `Bearer ${authToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Step 1: Create the issue link
  const linkPayload: Record<string, unknown> = {
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
    linkPayload.comment = {
      body: strategy.formatText(comment),
    };
  }

  try {
    await axiosClient.post(`${apiUrl}/issueLink`, linkPayload, { headers });
  } catch (error: unknown) {
    log.error("Error linking Jira issues:", error);
    return {
      success: false,
      linkSuccess: false,
      error: `Failed to link issues: ${getErrorMessage(error)}`,
    };
  }

  // Step 2: Fetch the outward issue to get its reporter
  let reporterId: string | undefined;
  try {
    const issueResponse = await axiosClient.get(`${apiUrl}/issue/${outwardIssueKey}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    const reporter = issueResponse.data?.fields?.reporter;
    // Cloud uses accountId, Data Center uses name/key
    reporterId = reporter?.accountId || reporter?.name || reporter?.key;

    if (!reporterId) {
      return {
        success: false,
        linkSuccess: true,
        assignSuccess: false,
        error: "Issue link was created, but the outward issue has no reporter to assign.",
      };
    }
  } catch (error: unknown) {
    log.error("Error fetching outward issue details:", error);
    return {
      success: false,
      linkSuccess: true,
      assignSuccess: false,
      error: `Issue link was created, but failed to fetch outward issue reporter: ${getErrorMessage(error)}`,
    };
  }

  // Step 3: Assign the reporter of the outward issue to the inward issue
  try {
    const assigneePayload = strategy.formatUser(reporterId);
    if (!assigneePayload) {
      return {
        success: false,
        linkSuccess: true,
        assignSuccess: false,
        error: "Issue link was created, but could not format reporter for assignment.",
      };
    }

    await axiosClient.put(`${apiUrl}/issue/${inwardIssueKey}/assignee`, assigneePayload, { headers });

    return {
      success: true,
      linkSuccess: true,
      assignSuccess: true,
      assignedReporter: reporterId,
    };
  } catch (error: unknown) {
    log.error("Error assigning reporter to inward issue:", error);
    return {
      success: false,
      linkSuccess: true,
      assignSuccess: false,
      error: `Issue link was created, but failed to assign reporter: ${getErrorMessage(error)}`,
    };
  }
};

export default linkAndAssignJiraIssues;
