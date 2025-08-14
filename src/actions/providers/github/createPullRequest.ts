import type {
  AuthParamsType,
  githubCreatePullRequestFunction,
  githubCreatePullRequestOutputType,
  githubCreatePullRequestParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getOctokit } from "./utils.js";

/**
 * Creates a pull request in a GitHub repository
 */
const createPullRequest: githubCreatePullRequestFunction = async ({
  params,
  authParams,
}: {
  params: githubCreatePullRequestParamsType;
  authParams: AuthParamsType;
}): Promise<githubCreatePullRequestOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { repositoryOwner, repositoryName, head, base, title, description } = params;

  const octokit = await getOctokit(authParams.authToken);
  const { RequestError } = await import("@octokit/request-error");

  try {
    // Create the pull request
    const { data: pullRequestData } = await octokit.rest.pulls.create({
      owner: repositoryOwner,
      repo: repositoryName,
      head,
      base,
      title,
      body: description,
    });

    return {
      success: true,
      pullRequestUrl: pullRequestData.html_url,
      pullRequestNumber: pullRequestData.number,
    };
  } catch (error) {
    if (error instanceof RequestError) {
      console.error("GitHub API error:", error.message);
      return { success: false, error: error.message };
    }
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

export default createPullRequest;
