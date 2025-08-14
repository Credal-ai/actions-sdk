import type {
  AuthParamsType,
  gitlabListDirectoryFunction,
  gitlabListDirectoryOutputType,
  gitlabListDirectoryParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const GITLAB_API_URL = "https://gitlab.com";

async function gitlabFetch<T = unknown>(endpoint: string, authToken: string): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitLab API error: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * List directory contents from a GitLab project
 */
const listDirectory: gitlabListDirectoryFunction = async ({
  params,
  authParams,
}: {
  params: gitlabListDirectoryParamsType; // { group: string; project: string; path: string; ref?: string }
  authParams: AuthParamsType;
}): Promise<gitlabListDirectoryOutputType> => {
  const { authToken, baseUrl } = authParams;
  const gitlabBaseUrl = baseUrl ?? GITLAB_API_URL;

  if (!authToken) throw new Error(MISSING_AUTH_TOKEN);

  const { group, project, path, ref = "main" } = params;
  const fullPath = `${group}/${project}`;
  const encodedProjectPath = encodeURIComponent(fullPath);

  const url =
    `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/repository/tree` +
    `?path=${encodeURIComponent(path)}` +
    `&ref=${encodeURIComponent(ref)}`;

  const treeItems = await gitlabFetch<{ name: string; path: string; type: string; size?: number }[]>(url, authToken);

  const content = treeItems.map(item => {
    const isFile = item.type === "blob";
    const htmlUrl = `${gitlabBaseUrl}/${fullPath}/-/blob/${ref}/${item.path}`;
    return {
      name: item.name,
      path: item.path,
      type: item.type, // "blob" or "tree"
      size: isFile ? (item.size ?? 0) : 0, // Size may not be returned; fallback to 0
      htmlUrl,
    };
  });

  return { content };
};

export default listDirectory;
