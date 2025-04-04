import {
  AuthParamsType,
  asanaUpdateTaskFunction,
  asanaUpdateTaskOutputType,
  asanaUpdateTaskParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { getUserIdByEmail, getWorkspaceIdAndPermalinkFromTask } from "./utils";

const updateAsanaTask: asanaUpdateTaskFunction = async ({
  params,
  authParams,
}: {
  params: asanaUpdateTaskParamsType;
  authParams: AuthParamsType;
}): Promise<asanaUpdateTaskOutputType> => {
  const { authToken } = authParams;
  const { name, taskId, description, customFields, completed, assignee, approvalStatus, dueAt } = params;

  if (!authToken || !taskId) {
    return { success: false, error: "Valid authToken, and taskId are required" };
  }

  const { workspaceId, permalinkUrl } = await getWorkspaceIdAndPermalinkFromTask(taskId, authToken);
  if (!workspaceId || !permalinkUrl) {
    return { success: false, error: "Task ID invalid: unable to get workspaceID or permalink" };
  }

  let assigneeId;
  if (assignee && assignee.includes("@")) {
    assigneeId = await getUserIdByEmail(authToken, workspaceId, assignee);
  } else {
    assigneeId = assignee;
  }

  try {
    await axiosClient.put(
      `https://app.asana.com/api/1.0/tasks/${taskId}`,
      {
        data: {
          workspace: workspaceId,
          ...(name && { name }),
          // only 1 of approvalStatus and completed can be set, so only set approvalStatus if completed is undefined
          ...(approvalStatus && completed === undefined && { approval_status: approvalStatus }),
          ...(assigneeId && { assignee: assigneeId }),
          ...(completed !== undefined && { completed }),
          ...(customFields && { custom_fields: customFields }),
          ...(description && { notes: description }),
          ...(dueAt && { due_at: dueAt }),
        },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    return {
      success: true,
      taskUrl: permalinkUrl,
    };
  } catch (error) {
    console.error("Error updating Asana task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updateAsanaTask;
