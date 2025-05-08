import axios from "axios";
import {
  type AuthParamsType,
  type githubListPullRequestsFunction,
  type githubListPullRequestsParamsType,
  type githubListPullRequestsOutputType,
  githubListPullRequestsOutputSchema,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const listPullRequests: githubListPullRequestsFunction = async ({
  params,
  authParams,
}: {
  params: githubListPullRequestsParamsType;
  authParams: AuthParamsType;
}): Promise<githubListPullRequestsOutputType> => {
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { repositoryName, repositoryOwner, state } = params;

  const url = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/pulls`;
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

    // Stop if the rest are older than one year
    if (pulls.length < perPage) break;

    page++;
  }

  return githubListPullRequestsOutputSchema.parse({
    pullRequests: allPulls,
  });
};

export default listPullRequests;
