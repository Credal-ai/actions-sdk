import axios from "axios";
import {
  type AuthParamsType,
  type githubListPullRequestsFunction,
  type githubListPullRequestsParamsType,
  type githubListPullRequestsOutputType,
  githubListPullRequestsOutputSchema,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const listPullRequests: githubListPullRequestsFunction = async ({
  params,
  authParams,
}: {
  params: githubListPullRequestsParamsType;
  authParams: AuthParamsType;
}): Promise<githubListPullRequestsOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    return githubListPullRequestsOutputSchema.parse({
      success: false,
      error: MISSING_AUTH_TOKEN,
    });
  }

  try {
    const { repositoryName, repositoryOwner, state } = params;

    const url = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls`;

    interface GitHubPullRequest {
      number: number;
      title: string;
      state: string;
      html_url: string;
      created_at: string;
      updated_at: string;
      user: {
        login: string;
      };
      body: string | null;
    }

    const allPulls: GitHubPullRequest[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await axios.get<GitHubPullRequest[]>(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        params: {
          state: state ?? "all",
          sort: "created",
          direction: "desc",
          per_page: perPage,
          page,
        },
      });

      const pulls = response.data;
      if (pulls.length === 0) break;
      allPulls.push(...pulls);

      // Stop if we got fewer than requested (last page)
      if (pulls.length < perPage) break;

      page++;
    }

    const results = allPulls.map(pull => ({
      name: pull.title,
      url: pull.html_url,
      contents: {
        number: pull.number,
        title: pull.title,
        state: pull.state,
        url: pull.html_url,
        createdAt: pull.created_at,
        updatedAt: pull.updated_at,
        user: {
          login: pull.user.login,
        },
        description: pull.body || "",
      },
    }));

    return githubListPullRequestsOutputSchema.parse({
      success: true,
      results,
    });
  } catch (error) {
    return githubListPullRequestsOutputSchema.parse({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
};

export default listPullRequests;
