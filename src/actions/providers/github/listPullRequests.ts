import axios from "axios";
import {
  type AuthParamsType,
  type githubListPullRequestsFunction,
  type githubListPullRequestsParamsType,
  type githubListPullRequestsOutputType,
  githubListPullRequestsOutputSchema,
} from "../../autogen/types";

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

  type PullRequest = githubListPullRequestsOutputType["pullRequests"][number];

  const allPulls: PullRequest[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await axios.get<PullRequest[]>(url, {
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
    const recentPulls = pulls.filter(pr => pr.createdAt && new Date(pr.createdAt) >= oneYearAgo);

    allPulls.push(...recentPulls);

    // Stop if the rest are older than one year
    if (recentPulls.length < pulls.length) break;

    page++;
  }

  return githubListPullRequestsOutputSchema.parse({
    pullRequests: allPulls,
  });
};

export default listPullRequests;
