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
  const { text, assignee, projects, completed, is_subtask, sort_by } = params;

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
        // Build query params according to Asana API
        const searchParams: Record<string, string | boolean> = {};
        if (text) searchParams.text = text;
        if (assignee) searchParams["assignee.any"] = assignee;
        if (projects && projects.length > 0) searchParams["projects.any"] = projects.join(",");
        if (completed !== undefined) searchParams.completed = completed;
        if (is_subtask !== undefined) searchParams.is_subtask = is_subtask;
        if (sort_by) searchParams.sort_by = sort_by;

        const searchResponse = await axiosClient.get(
          `https://app.asana.com/api/1.0/workspaces/${workspaceId}/tasks/search`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            params: searchParams,
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
      results: matches.map(match => ({
        name: match.name,
        url: `https://app.asana.com/0/${match.workspaceId}/${match.id}`,
        contents: match,
      })),
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
