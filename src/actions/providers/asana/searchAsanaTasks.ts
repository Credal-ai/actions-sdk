import type {
  AuthParamsType,
  asanaSearchTasksFunction,
  asanaSearchTasksOutputType,
  asanaSearchTasksParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const searchAsanaTasks: asanaSearchTasksFunction = async ({
  params,
  authParams,
}: {
  params: asanaSearchTasksParamsType;
  authParams: AuthParamsType;
}): Promise<asanaSearchTasksOutputType> => {
  const { authToken } = authParams;
  const { query } = params;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  try {
    // search api only searches within a workspace, so fetch all workspaces first
    const workspacesResponse = await axiosClient.get("https://app.asana.com/api/1.0/workspaces", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const workspaces = workspacesResponse?.data?.data;
    if (!Array.isArray(workspaces) || workspaces.length === 0) {
      throw new Error("No workspaces found");
    }

    const matches: { name: string; id: string; resourceType: string; workspaceId: string }[] = [];

    for (const workspace of workspaces) {
      const workspaceId = workspace.gid;
      try {
        const searchResponse = await axiosClient.get(
          `https://app.asana.com/api/1.0/workspaces/${workspaceId}/tasks/search`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            params: {
              text: query,
            },
          },
        );

        const tasks = searchResponse?.data?.data;
        if (Array.isArray(tasks)) {
          matches.push(
            ...tasks.map(({ gid, name, resource_type }) => ({
              id: gid,
              name,
              resourceType: resource_type,
              workspaceId,
            })),
          );
        }
      } catch (searchErr) {
        console.warn(`Search failed in workspace ${workspaceId}:`, searchErr);
      }
    }

    return {
      success: true,
      results: matches,
    };
  } catch (error) {
    console.error("Error searching Asana tasks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default searchAsanaTasks;
