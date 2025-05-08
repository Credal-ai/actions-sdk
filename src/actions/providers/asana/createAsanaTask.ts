import type {
  AuthParamsType,
  asanaCreateTaskFunction,
  asanaCreateTaskOutputType,
  asanaCreateTaskParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
import { getWorkspaceIdFromProject, getUserIdByEmail } from "./utils";

const getTaskTemplates = async (authToken: string, projectId: string) => {
  const url = `https://app.asana.com/api/1.0/task_templates/?project=${projectId}`;
  try {
    const response = await axiosClient.get(url, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Asana task templates:", error);
    return [];
  }
};

const createAsanaTask: asanaCreateTaskFunction = async ({
  params,
  authParams,
}: {
  params: asanaCreateTaskParamsType;
  authParams: AuthParamsType;
}): Promise<asanaCreateTaskOutputType> => {
  const { authToken } = authParams;
  const { name, projectId, description, customFields, taskTemplate, assignee, approvalStatus, dueAt } = params;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const workspaceId = await getWorkspaceIdFromProject(projectId, authToken);
  if (!workspaceId) {
    return { success: false, error: "Project ID invalid: unable to get workspaceID" };
  }

  let assigneeId;
  if (assignee && assignee.includes("@")) {
    assigneeId = await getUserIdByEmail(authToken, workspaceId, assignee);
  } else {
    assigneeId = assignee;
  }

  let templateId: string | null = null;
  try {
    if (taskTemplate) {
      const templates = await getTaskTemplates(authToken, projectId);

      if (/^\d+$/.test(taskTemplate)) {
        // Numeric: try ID match
        if (templates.some((t: { gid: string }) => t.gid === taskTemplate)) {
          templateId = taskTemplate;
        }
      } else {
        // Try to find a template by name
        const taskTemplateStr = taskTemplate.trim().toLowerCase();
        const matchedTemplate = templates.find((t: { name: string }) => t.name.toLowerCase() === taskTemplateStr);
        if (matchedTemplate) {
          templateId = matchedTemplate.gid;
        }
      }

      if (!templateId) {
        return {
          success: false,
          error: `Task template '${taskTemplate}' not found. Available templates: ${templates.map((t: { name: string }) => t.name).join(", ")}`,
        };
      }
    }

    const response = await axiosClient.post(
      `https://app.asana.com/api/1.0/tasks`,
      {
        data: {
          name,
          projects: [projectId],
          ...(description && { notes: description }),
          ...(customFields && { custom_fields: customFields }),
          ...(templateId && { task_template: templateId }),
          ...(assigneeId && { assignee: assigneeId }),
          ...(approvalStatus && { approval_status: approvalStatus }),
          ...(dueAt && { due_at: dueAt }),
        },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    // Validate response
    const taskGid = response?.data?.data?.gid;
    if (!taskGid) {
      throw new Error("Failed to create task: No valid task ID returned from Asana");
    }

    return {
      success: true,
      taskUrl: `https://app.asana.com/0/${projectId}/${taskGid}`,
    };
  } catch (error) {
    console.error("Error creating Asana task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default createAsanaTask;
