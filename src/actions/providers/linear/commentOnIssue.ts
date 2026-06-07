import type {
  AuthParamsType,
  linearCommentOnIssueFunction,
  linearCommentOnIssueOutputType,
  linearCommentOnIssueParamsType,
} from "../../autogen/types.js";
import { redactPII } from "./utils/piiRedaction.js";
import { logAction } from "./utils/auditLogger.js";

const commentOnIssue: linearCommentOnIssueFunction = async ({
  params,
  authParams,
}: {
  params: linearCommentOnIssueParamsType;
  authParams: AuthParamsType;
}): Promise<linearCommentOnIssueOutputType> => {
  const { authToken } = authParams;
  const { issueId, body, approved } = params;

  if (!authToken) {
    return { success: false, error: "Valid auth token is required" };
  }

  const redactedBody = redactPII(body);

  if (!approved) {
    logAction({
      timestamp: new Date().toISOString(),
      actionName: "commentOnIssue",
      provider: "linear",
      inputArgs: JSON.stringify({ issueId, body: redactedBody }),
      resultSummary: "pending_approval",
    });
    return {
      success: false,
      requiresApproval: true,
      pendingAction: {
        actionName: "commentOnIssue",
        provider: "linear",
        params: { issueId, body },
      },
    };
  }

  const mutation = `
    mutation CreateComment($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success
        comment {
          id
          url
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input: { issueId, body } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error: status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const result = data.data?.commentCreate;
    if (!result?.success) {
      const errorMsg = "Failed to post comment";
      logAction({
        timestamp: new Date().toISOString(),
        actionName: "commentOnIssue",
        provider: "linear",
        inputArgs: JSON.stringify({ issueId, body: redactedBody }),
        resultSummary: "failure",
        error: errorMsg,
      });
      return { success: false, error: errorMsg };
    }

    logAction({
      timestamp: new Date().toISOString(),
      actionName: "commentOnIssue",
      provider: "linear",
      inputArgs: JSON.stringify({ issueId, body: redactedBody }),
      resultSummary: `comment_posted:${result.comment.id}`,
    });

    return {
      success: true,
      commentId: result.comment.id,
    };
  } catch (error) {
    const errorMsg = redactPII(error instanceof Error ? error.message : "Unknown error");
    logAction({
      timestamp: new Date().toISOString(),
      actionName: "commentOnIssue",
      provider: "linear",
      inputArgs: JSON.stringify({ issueId, body: redactedBody }),
      resultSummary: "error",
      error: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
};

export default commentOnIssue;
