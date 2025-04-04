import { axiosClient } from "../../util/axiosClient";

export async function getWorkspaceIdFromProject(projectId: string, authToken: string): Promise<string | null> {
  if (!projectId || !authToken) {
    console.error("Project ID and authToken are required");
    return null;
  }

  try {
    const response = await axiosClient.get(`https://app.asana.com/api/1.0/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    return response.data?.data?.workspace?.gid || null;
  } catch (error) {
    console.error("Error fetching workspace ID from project:", error);
    return null;
  }
}

export async function getWorkspaceIdAndPermalinkFromTask(
  taskId: string,
  authToken: string,
): Promise<{ workspaceId: string | null; permalinkUrl: string | null }> {
  if (!taskId || !authToken) {
    console.error("Task ID and authToken are required");
    return { workspaceId: null, permalinkUrl: null };
  }

  try {
    const response = await axiosClient.get(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const workspaceId = response.data?.data?.workspace?.gid || null;
    const permalinkUrl = response.data?.data?.permalink_url || null; // Gets the task's URL

    return { workspaceId, permalinkUrl };
  } catch (error) {
    console.error("Error fetching workspace ID and permalink URL from task:", error);
    return { workspaceId: null, permalinkUrl: null };
  }
}

export async function getUserIdByEmail(authToken: string, workspaceId: string, email: string) {
  // Get all users in the workspace
  const url = `https://app.asana.com/api/1.0/workspaces/${workspaceId}/users?opt_fields=email,name,gid`;

  try {
    const response = await axiosClient.get(url, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Filter the users by email on the client side
    const matchingUser = response.data.data.find(
      (user: { gid: string; name: string; email: string }) =>
        user.email && user.email.toLowerCase() === email.toLowerCase(),
    );

    return matchingUser ? matchingUser.gid : null;
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
}
