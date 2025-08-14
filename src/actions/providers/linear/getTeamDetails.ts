import type {
  AuthParamsType,
  linearGetTeamDetailsFunction,
  linearGetTeamDetailsOutputType,
  linearGetTeamDetailsParamsType,
} from "../../autogen/types";

const getTeamDetails: linearGetTeamDetailsFunction = async ({
  params,
  authParams,
}: {
  params: linearGetTeamDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<linearGetTeamDetailsOutputType> => {
  const { authToken } = authParams;
  const { teamId } = params;

  if (!authToken) {
    throw new Error("Valid auth token is required to get Linear team details");
  }

  const query = `
    query GetTeam($id: String!) {
      team(id: $id) {
        id
        name
        key
        members {
          nodes {
            id
            name
            email
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
        variables: { id: teamId },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error, status: ${response.status} body: ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data?.team) {
      return {
        success: false,
        error: "Team not found",
      };
    }

    const { id, name, key, members } = data.data.team;

    return {
      success: true,
      team: {
        id,
        name,
        identifier: key,
        members: Array.isArray(members?.nodes)
          ? members.nodes.map(({ id, name, email }: { id: string; name: string; email: string }) => ({
              id,
              name,
              email,
            }))
          : [],
      },
    };
  } catch (error) {
    console.error("Error retrieving Linear team details: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getTeamDetails;
