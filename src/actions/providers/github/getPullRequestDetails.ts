import axios from "axios";
import {
  type AuthParamsType,
  type githubGetPullRequestDetailsFunction,
  type githubGetPullRequestDetailsParamsType,
  type githubGetPullRequestDetailsOutputType,
  githubGetPullRequestDetailsOutputSchema,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const getPullRequestDetails: githubGetPullRequestDetailsFunction = async ({
  params,
  authParams,
}: {
  params: githubGetPullRequestDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<githubGetPullRequestDetailsOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { repositoryOwner, repositoryName, pullRequestNumber } = params;

  try {
    const url = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls/${pullRequestNumber}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const pr = response.data;

    // Transform the GitHub API response to match our schema
    const transformedPR = {
      number: pr.number,
      title: pr.title,
      description: pr.body,
      state: pr.state === "closed" && pr.merged_at ? "merged" : pr.state,
      draft: pr.draft,
      url: pr.url,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      closedAt: pr.closed_at,
      mergedAt: pr.merged_at,
      author: pr.user
        ? {
            login: pr.user.login,
            id: pr.user.id,
            avatarUrl: pr.user.avatar_url,
            htmlUrl: pr.user.html_url,
          }
        : null,
      assignees:
        pr.assignees?.map((assignee: { login: string; id: number; avatar_url: string; html_url: string }) => ({
          login: assignee.login,
          id: assignee.id,
          avatarUrl: assignee.avatar_url,
          htmlUrl: assignee.html_url,
        })) || [],
      reviewers:
        pr.requested_reviewers?.map(
          (reviewer: { login: string; id: number; avatar_url: string; html_url: string }) => ({
            login: reviewer.login,
            id: reviewer.id,
            avatarUrl: reviewer.avatar_url,
            htmlUrl: reviewer.html_url,
          }),
        ) || [],
      labels:
        pr.labels?.map((label: { name: string; color: string; description?: string }) => ({
          name: label.name,
          color: label.color,
          description: label.description || null,
        })) || [],
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
        repo: pr.head.repo
          ? {
              name: pr.head.repo.name,
              fullName: pr.head.repo.full_name,
              owner: {
                login: pr.head.repo.owner.login,
              },
            }
          : null,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
        repo: pr.base.repo
          ? {
              name: pr.base.repo.name,
              fullName: pr.base.repo.full_name,
              owner: {
                login: pr.base.repo.owner.login,
              },
            }
          : null,
      },
      mergeable: pr.mergeable,
      mergeableState: pr.mergeable_state,
      merged: pr.merged,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      milestone: pr.milestone
        ? {
            title: pr.milestone.title,
            description: pr.milestone.description,
            state: pr.milestone.state,
            dueOn: pr.milestone.due_on,
          }
        : null,
    };

    return githubGetPullRequestDetailsOutputSchema.parse({
      success: true,
      pullRequest: transformedPR,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const responseError =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;

    return githubGetPullRequestDetailsOutputSchema.parse({
      success: false,
      error: responseError || errorMessage || "Failed to get pull request details",
    });
  }
};

export default getPullRequestDetails;
