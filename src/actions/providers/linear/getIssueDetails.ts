import type {
  AuthParamsType,
  linearGetIssueDetailsFunction,
  linearGetIssueDetailsOutputType,
  linearGetIssueDetailsParamsType,
} from "../../autogen/types";

type IssueData = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  state: { name: string } | null;
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  priority: number | null;
  estimate: number | null;
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { nodes: Array<{ user: { name: string } | null; body: string }> } | null;
};

const getIssueDetails: linearGetIssueDetailsFunction = async ({
  params,
  authParams,
}: {
  params: linearGetIssueDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<linearGetIssueDetailsOutputType> => {
  const { authToken } = authParams;
  const { issueId } = params;

  if (!authToken) {
    throw new Error("Valid auth token is required to get Linear issue details");
  }

  const query = `
    query GetIssue($id: String!) {
      issue(id: $id) {
        id
        title
        description
        url
        state {
          name
        }
        assignee {
          id
          name
        }
        creator {
          id
          name
        }
        team {
          id
          name
        }
        project {
          id
          name
        }
        priority
        estimate
        dueDate
        createdAt
        updatedAt
        labels {
          nodes {
            name
          }
        }
        comments {
          nodes {
            user {
              name
            }
            body
          }
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
        query,
        variables: { id: issueId },
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

    if (!data.data?.issue) {
      return {
        success: false,
        error: "Issue not found",
      };
    }

    const {
      id,
      title,
      description,
      url,
      state,
      assignee,
      creator,
      team,
      project,
      priority,
      estimate,
      dueDate,
      createdAt,
      updatedAt,
      labels,
      comments,
    } = data.data.issue as IssueData;

    return {
      success: true,
      issue: {
        id,
        title,
        description: description || undefined,
        state: state?.name || undefined,
        assignee: assignee ? { id: assignee.id, name: assignee.name } : undefined,
        creator: creator ? { id: creator.id, name: creator.name } : undefined,
        team: team ? { id: team.id, name: team.name } : undefined,
        project: project ? { id: project.id, name: project.name } : undefined,
        priority: priority || undefined,
        estimate: estimate || undefined,
        dueDate: dueDate || undefined,
        createdAt: createdAt || undefined,
        updatedAt: updatedAt || undefined,
        labels: Array.isArray(labels?.nodes) ? labels.nodes.map(({ name }) => name) : [],
        url: url || undefined,
        comments: Array.isArray(comments?.nodes)
          ? comments.nodes.map(({ user, body }) => ({
              author_name: user?.name || "Unknown",
              comment: body,
            }))
          : [],
        content: description || undefined,
      },
    };
  } catch (error) {
    console.error("Error retrieving Linear issue details: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getIssueDetails;
