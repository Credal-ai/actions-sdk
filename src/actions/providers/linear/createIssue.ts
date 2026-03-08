import type {
  AuthParamsType,
  linearCreateIssueFunction,
  linearCreateIssueOutputType,
  linearCreateIssueParamsType,
} from "../../autogen/types";

const createIssue: linearCreateIssueFunction = async ({
  params,
  authParams,
}: {
  params: linearCreateIssueParamsType;
  authParams: AuthParamsType;
}): Promise<linearCreateIssueOutputType> => {
  const { authToken } = authParams;
  const { title, description, teamId, assigneeId, priority, projectId, dueDate, labelIds, estimate } = params;

  if (!authToken) {
    throw new Error("Valid auth token is required to create a Linear issue");
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          title
          url
          identifier
        }
      }
    }
  `;

  const input: Record<string, unknown> = {
    title,
    teamId,
  };

  if (description !== undefined) {
    input.description = description;
  }
  if (assigneeId !== undefined) {
    input.assigneeId = assigneeId;
  }
  if (priority !== undefined) {
    input.priority = priority;
  }
  if (projectId !== undefined) {
    input.projectId = projectId;
  }
  if (dueDate !== undefined) {
    input.dueDate = dueDate;
  }
  if (labelIds !== undefined) {
    input.labelIds = labelIds;
  }
  if (estimate !== undefined) {
    input.estimate = estimate;
  }

  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input },
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

    const result = data.data?.issueCreate;
    if (!result?.success) {
      return {
        success: false,
        error: "Failed to create issue",
      };
    }

    return {
      success: true,
      issue: {
        id: result.issue.id,
        title: result.issue.title,
        url: result.issue.url,
        identifier: result.issue.identifier,
      },
    };
  } catch (error) {
    console.error("Error creating Linear issue: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default createIssue;
