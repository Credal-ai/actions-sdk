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
  metadata: GitLabBlob;
  matched_merge_requests: {
    title: string;
    web_url: string;
    author?: string;
    merged_at?: string;
  }[];
}

async function gitlabFetch<T = unknown>(endpoint: string, authToken: string): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
  return res.json();
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

async function getMRDiffs(input: { projectId: number, mrIid: number, authToken: string, baseUrl: string}): Promise<MRDiff[]> {
  const { projectId, mrIid, authToken, baseUrl } = input;
  const endpoint = `${baseUrl}/projects/${projectId}/merge_requests/${mrIid}/diffs`;
  return gitlabFetch<MRDiff[]>(endpoint, authToken);
}

/**
 * Creates a new branch in a GitHub repository
 */
const searchGroup: gitlabSearchGroupFunction = async ({
  params,
  authParams,
}: {
  params: gitlabSearchGroupParamsType;
  authParams: AuthParamsType;
}): Promise<gitlabSearchGroupOutputType> => {
  const { authToken, baseUrl } = authParams;

  const gitlabBaseUrl = `${baseUrl ?? GITLAB_API_URL}/api/v4`;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { query, groupId } = params;

  const [mrResults, blobResults] = await Promise.all([
    globalSearch<GitLabMergeRequest>({ scope: "merge_requests", query, groupId, authToken, baseUrl: gitlabBaseUrl }),
    globalSearch<GitLabBlob>({ scope: "blobs", query, groupId, authToken, baseUrl: gitlabBaseUrl }),
  ]);

  const mergeRequests: MergeRequestWithDiffs[] = await Promise.all(
    mrResults.map(async metadata => {
      const diffs = await getMRDiffs({ projectId: metadata.project_id, mrIid: metadata.iid, authToken, baseUrl: gitlabBaseUrl });
      return { metadata, diffs };
    }),
  );

  const blobs: GitLabBlobWithCorrelation[] = blobResults.map(blob => {
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
