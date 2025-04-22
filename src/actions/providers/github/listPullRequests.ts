import axios from "axios";
import {
  type AuthParamsType,
  type githubListPullRequestsFunction,
  type githubListPullRequestsParamsType,
  type githubListPullRequestsOutputType,
  githubListPullRequestsOutputSchema,
} from "../../autogen/types";
import { number } from "zod";

const listPullRequests: githubListPullRequestsFunction = async ({
  params,
  authParams,
}: {
  params: githubListPullRequestsParamsType;
  authParams: AuthParamsType;
}): Promise<githubListPullRequestsOutputType> => {
  const { authToken } = authParams;
  const { repositoryName, repositoryOwner } = params;

  const url = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls`;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const allPulls: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      params: {
        state: "all",
        sort: "created",
        direction: "desc",
        per_page: perPage,
        page,
      },
    });

    const pulls = response.data;
    if (pulls.length === 0) break;

    // Filter by date
    const recentPulls = pulls.filter((pr: any) => new Date(pr.created_at) >= oneYearAgo);
    allPulls.push(...recentPulls);

    // Stop if the rest are older than one year
    if (recentPulls.length < pulls.length) break;

    page++;
  }

  return githubListPullRequestsOutputSchema.parse({
    pullRequests: allPulls.map((pr: any) => ({
      title: pr.title,
      url: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      user: {
        login: pr.user.login,
        avatarUrl: pr.user.avatar_url,
        htmlUrl: pr.user.html_url,
      },
      state: pr.state,
      number: pr.number,
      description: pr.description,
    })),
  });
};

export default listPullRequests;
