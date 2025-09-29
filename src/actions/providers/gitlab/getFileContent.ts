import type {
  AuthParamsType,
  gitlabGetFileContentFunction,
  gitlabGetFileContentOutputType,
  gitlabGetFileContentParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getProjectPath } from "./utils.js";

interface GitLabRepositoryFileResponse {
  file_name: string;
  file_path: string;
  size: number;
  encoding: "base64";
  content: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
  web_url?: string;
}

const GITLAB_API_URL = "https://gitlab.com";

async function gitlabFetch<T = unknown>(endpoint: string, authToken: string): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Get file content from GitLab by project_id
 */
const getFileContent: gitlabGetFileContentFunction = async ({
  params,
  authParams,
}: {
  params: gitlabGetFileContentParamsType; // { project_id: number; path: string; ref?: string }
  authParams: AuthParamsType;
}): Promise<gitlabGetFileContentOutputType> => {
  const { authToken, baseUrl } = authParams;
  const gitlabBaseUrl = baseUrl ?? GITLAB_API_URL;

  if (!authToken) {
    return {
      success: false,
      error: MISSING_AUTH_TOKEN,
    };
  }

  const { project_id, path, ref = "HEAD" } = params;

  // The file path must be URL-encoded per GitLab API docs
  const filePath = encodeURIComponent(path);

  const fetchUrl = `${gitlabBaseUrl}/api/v4/projects/${project_id}/repository/files/${filePath}?ref=${encodeURIComponent(ref)}`;

  const data = await gitlabFetch<GitLabRepositoryFileResponse>(fetchUrl, authToken);

  if (data.encoding !== "base64" || typeof data.content !== "string") {
    return { success: false, error: `Unexpected response: ${JSON.stringify(data)}` };
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");

  // Get the project path to construct the correct web URL
  const projectPath = await getProjectPath(project_id, authToken, `${gitlabBaseUrl}/api/v4`);
  const url = data.web_url || `${gitlabBaseUrl}/${projectPath}/-/blob/${ref}/${path}`;

  return {
    success: true,
    results: [
      {
        name: data.file_name,
        url,
        contents: {
          content,
          size: Buffer.byteLength(content),
          name: data.file_name,
          htmlUrl: url,
        },
      },
    ],
  };
};

export default getFileContent;
