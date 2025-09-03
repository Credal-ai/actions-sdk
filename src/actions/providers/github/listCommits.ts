import axios from "axios";
import {
  type AuthParamsType,
  type githubListCommitsFunction,
  type githubListCommitsParamsType,
  type githubListCommitsOutputType,
  githubListCommitsOutputSchema,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

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

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      params: requestParams,
    });

    const commits = response.data;

    // Transform the GitHub API response to match our schema
    const transformedCommits = commits.map(
      (commit: {
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
        author?: { login: string; id: number; avatar_url: string; html_url: string } | null;
        committer?: { login: string; id: number; avatar_url: string; html_url: string } | null;
        parents: Array<{ sha: string; url: string; html_url: string }>;
      }) => ({
        sha: commit.sha,
        url: commit.url,
        htmlUrl: commit.html_url,
        commit: {
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            date: commit.commit.author.date,
          },
          committer: {
            name: commit.commit.committer.name,
            email: commit.commit.committer.email,
            date: commit.commit.committer.date,
          },
          tree: {
            sha: commit.commit.tree.sha,
            url: commit.commit.tree.url,
          },
          commentCount: commit.commit.comment_count || 0,
        },
        author: commit.author
          ? {
              login: commit.author.login,
              id: commit.author.id,
              avatarUrl: commit.author.avatar_url,
              htmlUrl: commit.author.html_url,
            }
          : null,
        committer: commit.committer
          ? {
              login: commit.committer.login,
              id: commit.committer.id,
              avatarUrl: commit.committer.avatar_url,
              htmlUrl: commit.committer.html_url,
            }
          : null,
        parents: commit.parents.map((parent: { sha: string; url: string; html_url: string }) => ({
          sha: parent.sha,
          url: parent.url,
          htmlUrl: parent.html_url,
        })),
      }),
    );

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
