import type {
  AuthParamsType,
  asanaCommentTaskFunction,
  asanaCommentTaskOutputType,
  asanaCommentTaskParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const commentAsanaTask: asanaCommentTaskFunction = async ({
  params,
  authParams,
}: {
  params: asanaCommentTaskParamsType;
  authParams: AuthParamsType;
}): Promise<asanaCommentTaskOutputType> => {
  const { authToken } = authParams;
  const { commentText, isPinned, taskId } = params;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  try {
    const response = await axiosClient.post(
      `https://app.asana.com/api/1.0/tasks/${taskId}/stories`,
      {
        data: {
          text: commentText,
          ...(isPinned !== undefined && { is_pinned: isPinned }),
        },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    // Validate response
    const commentGid = response?.data?.data?.gid;
    if (!commentGid) {
      throw new Error("Failed to create task: No valid comment ID returned from Asana");
    }

    return {
      success: true,
      commentUrl: `https://app.asana.com/0/0/${taskId}/${commentGid}/f`,
    };
  } catch (error) {
    console.error("Error creating Asana task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default commentAsanaTask;
