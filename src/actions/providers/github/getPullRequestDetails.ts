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

    interface GitHubPullRequest {
      number: number;
      title: string;
      body: string | null;
      state: string;
      draft: boolean;
      url: string;
      html_url: string;
      created_at: string;
      updated_at: string;
      closed_at: string | null;
      merged_at: string | null;
      merged: boolean;
      user: {
        login: string;
        id: number;
        avatar_url: string;
        html_url: string;
      } | null;
      assignees: Array<{
        login: string;
        id: number;
        avatar_url: string;
        html_url: string;
      }>;
      requested_reviewers: Array<{
        login: string;
        id: number;
        avatar_url: string;
        html_url: string;
      }>;
      labels: Array<{
        name: string;
        color: string;
        description?: string;
      }>;
      head: {
        ref: string;
        sha: string;
        repo: {
          name: string;
          full_name: string;
          owner: { login: string };
        } | null;
      };
      base: {
        ref: string;
        sha: string;
        repo: {
          name: string;
          full_name: string;
          owner: { login: string };
        } | null;
      };
      mergeable: boolean | null;
      mergeable_state: string | null;
      commits: number;
      additions: number;
      deletions: number;
      changed_files: number;
      milestone: {
        title: string;
        description: string | null;
        state: string;
        due_on: string | null;
      } | null;
    }

    const response = await axios.get<GitHubPullRequest>(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const pr = response.data;

    // Transform only the field names that differ between GitHub API and our schema
    const transformedPR = {
      ...pr,
      description: pr.body,
      state: pr.state === "closed" && pr.merged_at ? "merged" : pr.state,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      closedAt: pr.closed_at,
      mergedAt: pr.merged_at,
      author: pr.user
        ? {
            ...pr.user,
            avatarUrl: pr.user.avatar_url,
            htmlUrl: pr.user.html_url,
          }
        : null,
      assignees:
        pr.assignees?.map(assignee => ({
          ...assignee,
          avatarUrl: assignee.avatar_url,
          htmlUrl: assignee.html_url,
        })) || [],
      reviewers:
        pr.requested_reviewers?.map(reviewer => ({
          ...reviewer,
          avatarUrl: reviewer.avatar_url,
          htmlUrl: reviewer.html_url,
        })) || [],
      labels:
        pr.labels?.map(label => ({
          ...label,
          description: label.description || null,
        })) || [],
      head: {
        ...pr.head,
        repo: pr.head.repo
          ? {
              name: pr.head.repo.name,
              fullName: pr.head.repo.full_name,
              owner: pr.head.repo.owner,
            }
          : null,
      },
      base: {
        ...pr.base,
        repo: pr.base.repo
          ? {
              name: pr.base.repo.name,
              fullName: pr.base.repo.full_name,
              owner: pr.base.repo.owner,
            }
          : null,
      },
      mergeableState: pr.mergeable_state,
      changedFiles: pr.changed_files,
      milestone: pr.milestone
        ? {
            ...pr.milestone,
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
