import type {
  AuthParamsType,
  linearGetProjectDetailsFunction,
  linearGetProjectDetailsOutputType,
  linearGetProjectDetailsParamsType,
} from "../../autogen/types";

type ProjectData = {
  id: string;
  name: string;
  description: string | null;
  state: string;
  progress: number;
  targetDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  url: string;
  lead: { id: string; name: string } | null;
  teams: { nodes: Array<{ id: string; name: string }> };
  issues: { nodes: Array<{ id: string; title: string; url: string }> };
  projectUpdates: { nodes: Array<{ id: string; body: string; user: { name: string } | null; createdAt: string }> };
};

const getProjectDetails: linearGetProjectDetailsFunction = async ({
  params,
  authParams,
}: {
  params: linearGetProjectDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<linearGetProjectDetailsOutputType> => {
  const { authToken } = authParams;
  const { projectId } = params;

  if (!authToken) {
    throw new Error("Valid auth token is required to get Linear project details");
  }

  const query = `
    query GetProject($id: String!) {
      project(id: $id) {
        id
        name
        description
        state
        progress
        targetDate
        createdAt
        updatedAt
        url
        lead {
          id
          name
        }
        teams {
          nodes {
            id
            name
          }
        }
        issues {
          nodes {
            id
            title
            url
          }
        }
        projectUpdates {
          nodes {
            id
            body
            user {
              name
            }
            createdAt
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
        variables: { id: projectId },
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

    if (!data.data?.project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const {
      id,
      name,
      description,
      state,
      progress,
      targetDate,
      createdAt,
      updatedAt,
      url,
      lead,
      teams,
      issues,
      projectUpdates,
    } = data.data.project as ProjectData;

    return {
      success: true,
      project: {
        id,
        name,
        description: description || undefined,
        state: state || undefined,
        progress,
        targetDate: targetDate || undefined,
        createdAt: createdAt || undefined,
        updatedAt: updatedAt || undefined,
        lead: lead ? { id: lead.id, name: lead.name } : undefined,
        team:
          Array.isArray(teams?.nodes) && teams.nodes.length > 0
            ? { id: teams.nodes[0].id, name: teams.nodes[0].name }
            : undefined,
        issues: Array.isArray(issues?.nodes)
          ? issues.nodes.map(({ id, title, url }) => ({
              id,
              name: title,
              url,
            }))
          : [],
        url: url || undefined,
        updates: Array.isArray(projectUpdates?.nodes)
          ? projectUpdates.nodes.map(({ id, body, user, createdAt }) => ({
              id,
              content: body,
              author_name: user?.name || "Unknown",
              created_at: createdAt,
            }))
          : [],
        content: description || undefined,
      },
    };
  } catch (error) {
    console.error("Error retrieving Linear project details: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getProjectDetails;
