import type {
  AuthParamsType,
  gitlabSearchGroupFunction,
  gitlabSearchGroupOutputType,
  gitlabSearchGroupParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const GITLAB_API_URL = "https://gitlab.com";

const MAX_CODE_RESULTS = 15;
const MAX_COMMITS = 10;
const MAX_FILES_PER_COMMIT = 5;
const MAX_ISSUES_OR_PRS = 10;
const MAX_FILES_PER_PR = 5;
const MAX_PATCH_LINES = 20;
const MAX_FRAGMENT_LINES = 20;

type GitLabSearchScope = "merge_requests" | "blobs" | "commits";

interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
  description?: string;
  author?: { name: string };
  merged_at?: string;
}

interface MRDiff {
  old_path: string;
  new_path: string;
  diff: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  too_large?: boolean;
}

interface MergeRequestWithDiffs {
  metadata: GitLabMergeRequest;
  diffs: MRDiff[];
}

interface GitLabBlob {
  path: string;
  basename: string;
  data: string;
  project_id: number;
  ref: string;
  startline: number;
  filename: string;
}

interface GitLabBlobWithUrl extends GitLabBlob {
  web_url: string;
}

interface GitLabBlobWithCorrelation {
  metadata: GitLabBlobWithUrl;
  matchedMergeRequests: {
    title: string;
    web_url: string;
    author?: { name?: string };
    merged_at?: string;
  }[];
}

interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  created_at: string;
  message: string;
  project_id: number;
}

interface CommitDiffFile {
  old_path: string;
  new_path: string;
  diff?: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

interface MinimalGitLabCommit {
  sha: string;
  web_url: string;
  message: string;
  author: { name: string; email: string };
  created_at: string;
  files: { old_path: string; new_path: string; diff: string }[];
}

function createProjectPathCache() {
  return new Map<number, string>();
}

async function gitlabFetch<T = unknown>(endpoint: string, authToken: string): Promise<T> {
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } });
  if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  return res.json();
}

function constructBlobUrl(input: {
  baseUrl: string;
  projectPath: string;
  ref: string;
  path: string;
  startline?: number;
}): string {
  const { baseUrl, projectPath, ref, path, startline } = input;
  let url = `${baseUrl}/${projectPath}/-/blob/${ref}/${path}`;
  if (startline && startline > 0) url += `#L${startline}`;
  return url;
}

async function enhanceBlobWithUrl(
  blob: GitLabBlob,
  authToken: string,
  baseUrl: string,
  gitlabWebBaseUrl: string,
  projectPathCache: Map<number, string>,
): Promise<GitLabBlobWithUrl> {
  const endpoint = `${baseUrl}/projects/${blob.project_id}`;
  const project = await gitlabFetch<{ path_with_namespace: string }>(endpoint, authToken);
  const projectPath = project.path_with_namespace;
  projectPathCache.set(blob.project_id, projectPath);

  const web_url = constructBlobUrl({
    baseUrl: gitlabWebBaseUrl,
    projectPath,
    ref: blob.ref,
    path: blob.path,
    startline: blob.startline,
  });

  return { ...blob, web_url };
}

async function getCommitDetails(input: {
  projectPath: string;
  sha: string;
  authToken: string;
  baseUrl: string;
  webBaseUrl: string;
}): Promise<MinimalGitLabCommit> {
  const { projectPath, sha, authToken, baseUrl, webBaseUrl } = input;
  const encodedPath = encodeURIComponent(projectPath);

  const commit = await gitlabFetch<GitLabCommit>(
    `${baseUrl}/projects/${encodedPath}/repository/commits/${sha}`,
    authToken,
  );

  const diffs = await gitlabFetch<CommitDiffFile[]>(
    `${baseUrl}/projects/${encodedPath}/repository/commits/${sha}/diff`,
    authToken,
  );

  return {
    sha: commit.id,
    web_url: `${webBaseUrl}/${projectPath}/-/commit/${commit.id}`,
    message: commit.message,
    author: { name: commit.author_name, email: commit.author_email },
    created_at: commit.created_at,
    files: (diffs || []).slice(0, MAX_FILES_PER_COMMIT).map(diff => ({
      old_path: diff.old_path,
      new_path: diff.new_path,
      diff: diff.diff ? diff.diff.split("\n").slice(0, MAX_PATCH_LINES).join("\n") : "",
    })),
  };
}

const searchGroup: gitlabSearchGroupFunction = async ({
  params,
  authParams,
}: {
  params: gitlabSearchGroupParamsType;
  authParams: AuthParamsType;
}): Promise<gitlabSearchGroupOutputType> => {
  const { authToken, baseUrl } = authParams;
  const gitlabBaseUrl = baseUrl ?? GITLAB_API_URL;
  const gitlabBaseApiUrl = `${gitlabBaseUrl}/api/v4`;

  if (!authToken) throw new Error(MISSING_AUTH_TOKEN);

  const { query, groupId, project } = params;
  const projectPathCache = createProjectPathCache();

  const fullProjectPath = project ? `${groupId}/${project}` : undefined;
  const encodedGroup = encodeURIComponent(groupId);

  const fetchSearchResults = async <T>(scope: GitLabSearchScope): Promise<T[]> => {
    const endpoint = fullProjectPath
      ? `${gitlabBaseApiUrl}/projects/${encodeURIComponent(fullProjectPath)}/search?scope=${scope}&search=${encodeURIComponent(query)}`
      : `${gitlabBaseApiUrl}/groups/${encodedGroup}/search?scope=${scope}&search=${encodeURIComponent(query)}`;
    return gitlabFetch<T[]>(endpoint, authToken);
  };

  const [mrResults, blobResults, commitResults] = await Promise.all([
    fetchSearchResults<GitLabMergeRequest>("merge_requests"),
    fetchSearchResults<GitLabBlob>("blobs"),
    fetchSearchResults<GitLabCommit>("commits"),
  ]);

  const limitedMRResults = mrResults.slice(0, MAX_ISSUES_OR_PRS);
  const mergeRequests: MergeRequestWithDiffs[] = await Promise.all(
    limitedMRResults.map(async metadata => {
      const endpoint =  `${gitlabBaseApiUrl}/projects/${metadata.project_id}/merge_requests/${metadata.iid}/diffs`;

      let diffs = await gitlabFetch<MRDiff[]>(endpoint, authToken);
      diffs = (diffs || []).slice(0, MAX_FILES_PER_PR).map(diff => ({
        ...diff,
        diff: diff.diff ? diff.diff.split("\n").slice(0, MAX_PATCH_LINES).join("\n") : diff.diff,
      }));

      return { metadata, diffs };
    }),
  );

  const limitedBlobResults = blobResults.slice(0, MAX_CODE_RESULTS);
  const blobsWithUrls: GitLabBlobWithUrl[] = await Promise.all(
    limitedBlobResults.map(blob =>
      enhanceBlobWithUrl(blob, authToken, gitlabBaseApiUrl, gitlabBaseUrl, projectPathCache),
    ),
  );

  const blobs: GitLabBlobWithCorrelation[] = blobsWithUrls.map(blob => {
    const matches = mergeRequests
      .filter(mr => mr.metadata.project_id === blob.project_id && mr.diffs.some(diff => diff.new_path === blob.path))
      .map(mr => ({
        title: mr.metadata.title,
        web_url: mr.metadata.web_url,
        author: mr.metadata.author ? { name: mr.metadata.author.name } : undefined,
        merged_at: mr.metadata.merged_at,
      }));

    return {
      metadata: {
        ...blob,
        data: blob.data.split("\n").slice(0, MAX_FRAGMENT_LINES).join("\n"),
      },
      matchedMergeRequests: matches,
    };
  });

  const limitedCommitResults = commitResults.slice(0, MAX_COMMITS);
  const commits: MinimalGitLabCommit[] = await Promise.all(
    limitedCommitResults.map(commit =>
      getCommitDetails({
        projectPath: fullProjectPath ?? projectPathCache.get(commit.project_id)!,
        sha: commit.id,
        authToken,
        baseUrl: gitlabBaseApiUrl,
        webBaseUrl: gitlabBaseUrl,
      }),
    ),
  );

  return {
    mergeRequests,
    blobs,
    commits,
  };
};

export default searchGroup;
