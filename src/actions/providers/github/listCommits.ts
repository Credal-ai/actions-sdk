import axios from "axios";
import {
  type AuthParamsType,
  type githubListCommitsFunction,
  type githubListCommitsParamsType,
  type githubListCommitsOutputType,
  githubListCommitsOutputSchema,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

interface GitHubCommit {
  sha: string;
  url: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    tree: { sha: string; url: string };
    comment_count?: number;
  };
  author?: { login: string } | null;
  parents: Array<{ sha: string; url: string; html_url: string }>;
}

const listCommits: githubListCommitsFunction = async ({
  params,
  authParams,
}: {
  params: githubListCommitsParamsType;
  authParams: AuthParamsType;
}): Promise<githubListCommitsOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { repositoryName, repositoryOwner, branch, since, until, author, perPage = 30, page = 1 } = params;

  try {
    const url = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/commits`;

    const requestParams: Record<string, string | number> = {
      per_page: Math.min(perPage, 100), // GitHub API max is 100
      page,
    };

    if (branch) {
      requestParams.sha = branch;
    }
    if (since) {
      requestParams.since = since;
    }
    if (until) {
      requestParams.until = until;
    }
    if (author) {
      requestParams.author = author;
    }

    const response = await axios.get<GitHubCommit[]>(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      params: requestParams,
    });

    const commits = response.data;

    // Transform only the field names that differ between GitHub API and our schema
    const transformedCommits = commits.map(commit => ({
      ...commit,
      htmlUrl: commit.html_url,
      commit: {
        ...commit.commit,
        commentCount: commit.commit.comment_count || 0,
      },
      author: commit.author,
      parents: commit.parents.map(parent => ({
        ...parent,
        htmlUrl: parent.html_url,
      })),
    }));

    // Check if there are more pages by looking at the Link header
    const linkHeader = response.headers.link;
    const hasMore = linkHeader ? linkHeader.includes('rel="next"') : false;

    return githubListCommitsOutputSchema.parse({
      success: true,
      commits: transformedCommits,
      totalCount: commits.length, // Note: GitHub doesn't provide total count in this endpoint
      hasMore,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const responseError =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;

    return githubListCommitsOutputSchema.parse({
      success: false,
      error: responseError || errorMessage || "Failed to list commits",
      commits: [],
      totalCount: 0,
      hasMore: false,
    });
  }
};

export default listCommits;
