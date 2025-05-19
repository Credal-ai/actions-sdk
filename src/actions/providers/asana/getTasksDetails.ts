import type {
  AuthParamsType,
  asanaGetTasksDetailsFunction,
  asanaGetTasksDetailsOutputType,
  asanaGetTasksDetailsParamsType,
} from "../../autogen/types";
import { asanaGetTasksDetailsOutputSchema } from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const getTasksDetails: asanaGetTasksDetailsFunction = async ({
  params,
  authParams,
}: {
  params: asanaGetTasksDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<asanaGetTasksDetailsOutputType> => {
  const { authToken } = authParams;
  const { taskIds } = params;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const tasks = [];
  // Get task details
  try {
    for (const taskId of taskIds) {
      const taskResponse = await axiosClient.get(
        `https://app.asana.com/api/1.0/tasks/${taskId}?opt_fields=name,notes,assignee,completed,due_on,approval_status`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const taskData = taskResponse.data.data;

      // Get the story (comments)
      const storyResponse = await axiosClient.get(
        `https://app.asana.com/api/1.0/tasks/${taskId}/stories?opt_fields=text,created_at,created_by,resource_subtype`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const storyData = storyResponse.data.data;
      const comments = storyData.map((story: { text: string; created_at: string; created_by: { name: string } }) => ({
        text: story.text,
        created_at: story.created_at,
        creator_name: story.created_by.name,
      }));
      let nextLink = storyResponse.data.next_page?.uri;
      while (nextLink) {
        const nextResponse = await axiosClient.get(nextLink, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const nextData = nextResponse.data.data;
        comments.push(
          ...nextData.map((story: { text: string; created_at: string; created_by: { name: string } }) => ({
            text: story.text,
            created_at: story.created_at,
            creator_name: story.created_by.name,
          })),
        );
        nextLink = nextResponse.data.next_page?.uri;
      }

      const taskDetails = {
        id: taskData.gid,
        name: taskData.name,
        notes: taskData.notes,
        assignee_name: taskData.assignee.name,
        approval_status: taskData.approval_status,
        completed: taskData.completed,
        due_at: taskData.due_on,
        comments: comments,
      };
      tasks.push(taskDetails);
    }
  } catch (error) {
    console.warn("Error getting task details:", error);
  }

  return asanaGetTasksDetailsOutputSchema.parse({ success: true, results: tasks });
};

export default getTasksDetails;
