import type {
  AuthParamsType,
  gitlabSearchGroupFunction,
  gitlabSearchGroupOutputType,
  gitlabSearchGroupParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const GITLAB_API_URL = "https://gitlab.com";

type GitLabSearchScope = "merge_requests" | "blobs";

interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
  description?: string;
  author?: {
    name: string;
  };
  merged_at?: string;
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

// Enhanced blob interface with web_url
interface GitLabBlobWithUrl extends GitLabBlob {
  web_url: string;
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

interface GitLabBlobWithCorrelation {
  metadata: GitLabBlobWithUrl;
  matched_merge_requests: {
    title: string;
    web_url: string;
    author?: string;
    merged_at?: string;
  }[];
}

// Cache for project paths to avoid repeated API calls
const projectPathCache = new Map<number, string>();

async function gitlabFetch<T = unknown>(endpoint: string, authToken: string): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function getProjectPath(projectId: number, authToken: string, baseUrl: string): Promise<string> {
  // Check cache first
  if (projectPathCache.has(projectId)) {
    return projectPathCache.get(projectId)!;
  }

  try {
    const project = await gitlabFetch<{ path_with_namespace: string }>(`${baseUrl}/projects/${projectId}`, authToken);

    const path = project.path_with_namespace;
    projectPathCache.set(projectId, path);
    return path;
  } catch (error) {
    console.warn(`Failed to fetch project path for project ${projectId}:`, error);
    // Fallback to project ID if we can't get the path
    return `project-${projectId}`;
  }
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

  // Add line number anchor if provided
  if (startline && startline > 0) {
    url += `#L${startline}`;
  }

  return url;
}

async function enhanceBlobWithUrl(
  blob: GitLabBlob,
  authToken: string,
  baseUrl: string,
  gitlabWebBaseUrl: string,
): Promise<GitLabBlobWithUrl> {
  try {
    const projectPath = await getProjectPath(blob.project_id, authToken, baseUrl);

    const web_url = constructBlobUrl({
      baseUrl: gitlabWebBaseUrl,
      projectPath,
      ref: blob.ref,
      path: blob.path,
      startline: blob.startline,
    });

    return {
      ...blob,
      web_url,
    };
  } catch (error) {
    console.warn(`Failed to construct URL for blob in project ${blob.project_id}:`, error);

    // Fallback URL construction
    const fallbackUrl = constructBlobUrl({
      baseUrl: gitlabWebBaseUrl,
      projectPath: `project-${blob.project_id}`,
      ref: blob.ref,
      path: blob.path,
      startline: blob.startline,
    });

    return {
      ...blob,
      web_url: fallbackUrl,
    };
  }
}

async function globalSearch<T>(input: {
  baseUrl: string;
  scope: GitLabSearchScope;
  query: string;
  groupId: string;
  authToken: string;
}): Promise<T[]> {
  const { scope, query, groupId, authToken, baseUrl } = input;
  const endpoint = `${baseUrl}/groups/${groupId}/search?scope=${scope}&search=${encodeURIComponent(query)}`;
  return gitlabFetch<T[]>(endpoint, authToken);
}

async function getMRDiffs(input: {
  projectId: number;
  mrIid: number;
  authToken: string;
  baseUrl: string;
}): Promise<MRDiff[]> {
  const { projectId, mrIid, authToken, baseUrl } = input;
  const endpoint = `${baseUrl}/projects/${projectId}/merge_requests/${mrIid}/diffs`;
  return gitlabFetch<MRDiff[]>(endpoint, authToken);
}

/**
 * Searches for merge requests and blobs in a GitLab group
 */
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

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { query, groupId } = params;

  const [mrResults, blobResults] = await Promise.all([
    globalSearch<GitLabMergeRequest>({
      scope: "merge_requests",
      query,
      groupId,
      authToken,
      baseUrl: gitlabBaseApiUrl,
    }),
    globalSearch<GitLabBlob>({
      scope: "blobs",
      query,
      groupId,
      authToken,
      baseUrl: gitlabBaseApiUrl,
    }),
  ]);

  const mergeRequests: MergeRequestWithDiffs[] = await Promise.all(
    mrResults.map(async metadata => {
      const diffs = await getMRDiffs({
        projectId: metadata.project_id,
        mrIid: metadata.iid,
        authToken,
        baseUrl: gitlabBaseApiUrl,
      });
      return { metadata, diffs };
    }),
  );

  // Enhance blobs with web URLs
  const blobsWithUrls: GitLabBlobWithUrl[] = await Promise.all(
    blobResults.map(blob => enhanceBlobWithUrl(blob, authToken, gitlabBaseApiUrl, gitlabBaseUrl)),
  );

  const blobs: GitLabBlobWithCorrelation[] = blobsWithUrls.map(blob => {
    const matches = mergeRequests
      .filter(mr => mr.metadata.project_id === blob.project_id && mr.diffs.some(diff => diff.new_path === blob.path))
      .map(mr => ({
        title: mr.metadata.title,
        web_url: mr.metadata.web_url,
        author: mr.metadata.author?.name,
        merged_at: mr.metadata.merged_at,
      }));

    return {
      metadata: blob,
      matched_merge_requests: matches,
    };
  });

  return {
    mergeRequests,
    blobs,
  };
};

export default searchGroup;
