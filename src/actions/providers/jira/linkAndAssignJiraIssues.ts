import type {
  AuthParamsType,
  jiraLinkAndAssignJiraIssuesFunction,
  jiraLinkAndAssignJiraIssuesOutputType,
  jiraLinkAndAssignJiraIssuesParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

/**
 * Build the Authorization header. When `userEmail` is present the token is
 * treated as an Atlassian API token and Basic auth is used; otherwise the
 * token is treated as an OAuth 2.0 access token and Bearer auth is used.
 */
function getAuthHeader(authToken: string, userEmail?: string): string {
  if (userEmail) {
    const encoded = Buffer.from(`${userEmail}:${authToken}`).toString("base64");
    return `Basic ${encoded}`;
  }
  return `Bearer ${authToken}`;
}

/**
 * Resolve the API base URL.  When the caller supplies a `userEmail` (API-token
 * flow) the Atlassian cloud gateway (`api.atlassian.com`) cannot be used, so
 * we fall back to `baseUrl/rest/api/3`.
 */
function resolveApiUrl(authParams: AuthParamsType): { apiUrl: string; strategy: ReturnType<typeof getJiraApiConfig>["strategy"] } {
  if (authParams.userEmail && authParams.baseUrl) {
    const { strategy } = getJiraApiConfig(authParams);
    const trimmedUrl = authParams.baseUrl.endsWith("/") ? authParams.baseUrl.slice(0, -1) : authParams.baseUrl;
    return { apiUrl: `${trimmedUrl}/rest/api/3`, strategy };
  }
  const { apiUrl, strategy } = getJiraApiConfig(authParams);
  return { apiUrl, strategy };
}

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

  const { apiUrl, strategy } = resolveApiUrl(authParams);
  const authorization = getAuthHeader(authToken, authParams.userEmail);

  const headers = {
    Authorization: authorization,
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
    console.error("Error linking Jira issues:", error);
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
        Authorization: authorization,
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
    console.error("Error fetching outward issue details:", error);
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
    console.error("Error assigning reporter to inward issue:", error);
    return {
      success: false,
      linkSuccess: true,
      assignSuccess: false,
      assignedReporter: reporterId,
      error: `Issue link was created, but failed to assign reporter: ${getErrorMessage(error)}`,
    };
  }
};

export default linkAndAssignJiraIssues;
