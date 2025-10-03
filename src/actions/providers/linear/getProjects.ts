import type {
  AuthParamsType,
  linearGetProjectsFunction,
  linearGetProjectsOutputType,
  linearGetProjectsParamsType,
} from "../../autogen/types";

type ProjectNode = {
  id: string;
  name: string;
  description: string | null;
  state: string;
  progress: number;
  url: string;
  creator: { id: string; name: string } | null;
  lead: { id: string; name: string } | null;
  labels: { nodes: Array<{ name: string }> };
};

const getProjects: linearGetProjectsFunction = async ({
  authParams,
}: {
  params: linearGetProjectsParamsType;
  authParams: AuthParamsType;
}): Promise<linearGetProjectsOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Valid auth token is required to get Linear projects");
  }

  const query = `
    query GetProjects {
      projects {
        nodes {
          id
          name
          description
          state
          progress
          url
          creator {
            id
            name
          }
          lead {
            id
            name
          }
          labels {
            nodes {
              name
            }
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
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data?.projects) {
      return {
        success: false,
        error: "No projects found",
      };
    }

    const { nodes } = data.data.projects;
    const projects = Array.isArray(nodes) ? nodes : [];

    return {
      success: true,
      results: projects.map((project: ProjectNode) => {
        const { id, name, description, state, progress, url, creator, lead, labels } = project;
        return {
          name: name,
          url: url,
          contents: {
            id,
            name,
            status: state,
            labels: Array.isArray(labels?.nodes) ? labels.nodes.map(({ name }) => name) : [],
            content: description || undefined,
            description: description || undefined,
            creator: creator ? { id: creator.id, name: creator.name } : undefined,
            lead: lead ? { id: lead.id, name: lead.name } : undefined,
            progress,
            url,
          },
        };
      }),
    };
  } catch (error) {
    console.error("Error retrieving Linear projects: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getProjects;
