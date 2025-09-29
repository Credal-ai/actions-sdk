export async function gitlabFetch<T = unknown>(endpoint: string, authToken: string): Promise<T> {
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } });
  if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getProjectPath(
  projectId: number,
  authToken: string,
  baseUrl: string,
  projectPathCache?: Map<number, string>,
): Promise<string> {
  if (projectPathCache && projectPathCache.has(projectId)) return projectPathCache.get(projectId)!;
  try {
    const project = await gitlabFetch<{ path_with_namespace: string }>(`${baseUrl}/projects/${projectId}`, authToken);
    const path = project.path_with_namespace;
    if (projectPathCache) projectPathCache.set(projectId, path);
    return path;
  } catch (error) {
    console.warn(`Failed to fetch project path for project ${projectId}:`, error);
    return `project-${projectId}`;
  }
}

export function createProjectPathCache() {
  return new Map<number, string>();
}
