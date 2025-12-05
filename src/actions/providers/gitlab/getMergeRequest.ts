// ============================================================================
// TYPES
// ============================================================================

interface GitLabMergeRequestMetadata {
  iid: number;
  id: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  merged: boolean;
  sha: string;

  source_branch: string;
  target_branch: string;

  diff_refs: {
    base_sha: string;
    head_sha: string;
    start_sha: string;
  };

  author: {
    id: number;
    name: string;
    username: string;
    avatar_url?: string;
  };

  web_url: string;
  source_sha: string;
  target_sha?: string;
}

interface GitLabMergeRequestChangedFile {
  old_path: string;
  new_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  diff: string; // unified diff text
}

interface GitLabMergeRequestCommit {
  id: string; // full SHA
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getProjectPath } from "./utils.js";
import type {
  AuthParamsType,
  gitlabGetMergeRequestFunction,
  gitlabGetMergeRequestOutputType,
  gitlabGetMergeRequestParamsType,
} from "../../autogen/types.js";

const GITLAB_API_URL = "https://gitlab.com";

async function gitlabFetch<T>(url: string, authToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const getMergeRequestContent: gitlabGetMergeRequestFunction = async ({
  params,
  authParams,
}: {
  params: gitlabGetMergeRequestParamsType; // { project_id: number; mr_iid: number }
  authParams: AuthParamsType;
}): Promise<gitlabGetMergeRequestOutputType> => {
  const { authToken, baseUrl } = authParams;
  const gitlabBaseUrl = baseUrl ?? GITLAB_API_URL;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { project_id, project_path, mr_iid } = params;
  const projectIdOrEncodedProjectPath = project_path ? encodeURIComponent(project_path) : project_id;

  // --------------------------------------------------------------------------
  // 1. Fetch MR metadata
  // --------------------------------------------------------------------------
  const mrUrl = `${gitlabBaseUrl}/api/v4/projects/${projectIdOrEncodedProjectPath}/merge_requests/${mr_iid}`;

  const mr = await gitlabFetch<GitLabMergeRequestMetadata>(mrUrl, authToken);

  const projectPath = project_path
    ? project_path
    : project_id
      ? await getProjectPath(project_id, authToken, `${gitlabBaseUrl}/api/v4`)
      : undefined;
  const encodedProjectPath = projectPath ? encodeURIComponent(projectPath) : undefined;

  if (!encodedProjectPath) {
    throw new Error("Project path or project ID is required to fetch merge request");
  }

  const webUrl = mr.web_url ?? `${gitlabBaseUrl}/${encodedProjectPath}/-/merge_requests/${mr_iid}`;

  const metadata: GitLabMergeRequestMetadata = {
    iid: mr.iid,
    id: mr.id,
    project_id: mr.project_id,
    title: mr.title,
    description: mr.description ?? "",
    state: mr.state,
    merged: mr.merged,
    sha: mr.sha,
    diff_refs: mr.diff_refs,
    author: mr.author,
    web_url: webUrl,
    source_branch: mr.source_branch,
    target_branch: mr.target_branch,
    source_sha: mr.diff_refs?.head_sha ?? mr.sha,
    target_sha: mr.diff_refs?.base_sha,
  };

  // --------------------------------------------------------------------------
  // 2. Fetch MR changes
  // --------------------------------------------------------------------------
  const changesUrl = `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/merge_requests/${mr_iid}/changes`;
  const changesData = await gitlabFetch<{ changes: GitLabMergeRequestChangedFile[] }>(changesUrl, authToken);
  const changes: GitLabMergeRequestChangedFile[] = changesData.changes.map(c => ({
    old_path: c.old_path,
    new_path: c.new_path,
    new_file: c.new_file,
    renamed_file: c.renamed_file,
    deleted_file: c.deleted_file,
    diff: c.diff,
  }));

  // --------------------------------------------------------------------------
  // 3. Fetch MR commits
  // --------------------------------------------------------------------------
  const commitsUrl = `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/merge_requests/${mr_iid}/commits`;
  const commitsData = await gitlabFetch<GitLabMergeRequestCommit[]>(commitsUrl, authToken);
  const commits: GitLabMergeRequestCommit[] = commitsData.map(c => ({
    id: c.id,
    title: c.title,
    message: c.message,
    author_name: c.author_name,
    author_email: c.author_email,
    created_at: c.created_at,
  }));

  // --------------------------------------------------------------------------
  // Return final structured result
  // --------------------------------------------------------------------------
  return {
    success: true,
    results: [
      {
        metadata,
        changes,
        commits,
      },
    ],
  };
};

export default getMergeRequestContent;
