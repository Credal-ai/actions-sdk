import type {
  AuthParamsType,
  asanaGetTasksDetailsFunction,
  asanaGetTasksDetailsOutputType,
  asanaGetTasksDetailsParamsType,
} from "../../autogen/types";
import { asanaGetTasksDetailsOutputSchema } from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

// Define interfaces for better type safety
interface AsanaStoryResponse {
  data: {
    text: string;
    created_at: string;
    created_by: { name: string; gid: string };
    resource_subtype: string;
  }[];
  next_page: { uri: string } | null;
}

interface AsanaTaskResponse {
  data: {
    gid: string;
    name: string;
    notes: string;
    assignee: { name: string } | null;
    approval_status: string | null;
    completed: boolean;
    due_at: string | null;
    created_at: string | null;
  };
}

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
    return { success: false, errors: [MISSING_AUTH_TOKEN] };
  }

  const tasks = [];
  const errors = [];

  // Process each task ID
  for (const taskId of taskIds) {
    try {
      // Get task details
      const taskResponse = await axiosClient.get<AsanaTaskResponse>(
        `https://app.asana.com/api/1.0/tasks/${taskId}?opt_fields=name,notes,assignee,assignee.name,created_at,completed,due_at,approval_status`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const taskData = taskResponse.data.data;

      // Validate task data exists
      if (!taskData) {
        throw new Error(`No data returned for task ${taskId}`);
      }

      // Get the stories (comments)
      const storyResponse = await axiosClient.get<AsanaStoryResponse>(
        `https://app.asana.com/api/1.0/tasks/${taskId}/stories?opt_fields=text,created_at,created_by,resource_subtype`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      // Filter and map comments
      const comments = storyResponse.data.data
        .filter(story => story.resource_subtype === "comment_added")
        .map(story => ({
          text: story.text,
          created_at: story.created_at,
          creator_name: story.created_by?.name || "Unknown",
        }));

      // Handle pagination for comments
      let nextLink = storyResponse.data.next_page?.uri;
      while (nextLink) {
        const nextResponse = await axiosClient.get<AsanaStoryResponse>(nextLink, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const nextData = nextResponse.data;

        // Filter for comments and add to the array
        const additionalComments = nextData.data
          .filter(story => story.resource_subtype === "comment_added")
          .map(story => ({
            text: story.text,
            created_at: story.created_at,
            creator_name: story.created_by?.name || "Unknown",
          }));

        comments.push(...additionalComments);
        nextLink = nextResponse.data.next_page?.uri;
      }

      const taskDetails = {
        id: taskData.gid,
        name: taskData.name || "",
        notes: taskData.notes || "",
        assignee_name: taskData.assignee?.name || "",
        approval_status: taskData.approval_status || "",
        completed: taskData.completed || false,
        created_at: taskData.created_at || "",
        due_at: taskData.due_at,
        comments: comments,
      };

      tasks.push(taskDetails);
    } catch (error) {
      console.warn(`Error getting details for task ${taskId}:`, error);
      errors.push(JSON.stringify(error));
    }
  }

  if (errors.length > 0 && tasks.length === 0) {
    return { success: false, errors };
  }

  const result = {
    success: true,
    results: tasks,
  };

  return asanaGetTasksDetailsOutputSchema.parse(result);
};

export default getTasksDetails;
