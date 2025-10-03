import type {
  AuthParamsType,
  linearGetTeamsFunction,
  linearGetTeamsOutputType,
  linearGetTeamsParamsType,
} from "../../autogen/types";

const getTeams: linearGetTeamsFunction = async ({
  authParams,
}: {
  params: linearGetTeamsParamsType;
  authParams: AuthParamsType;
}): Promise<linearGetTeamsOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Valid auth token is required to get Linear teams");
  }

  const query = `
    query GetTeams {
      teams {
        nodes {
          id
          name
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

    if (!data.data?.teams) {
      return {
        success: false,
        error: "No teams found",
      };
    }

    const { nodes } = data.data.teams;
    const teams = Array.isArray(nodes) ? nodes : [];

    return {
      success: true,
      results: teams.map((team: { id: string; name: string }) => ({
        name: team.name,
        url: `https://linear.app/team/${team.id}`,
        contents: {
          id: team.id,
          name: team.name,
        },
      })),
    };
  } catch (error) {
    console.error("Error retrieving Linear teams: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getTeams;
