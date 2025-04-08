import type {
  AuthParamsType,
  githubCreatePullRequestFunction,
  githubCreatePullRequestOutputType,
  githubCreatePullRequestParamsType,
} from "../../autogen/types";

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
    return { success: false, error: "authToken is required for GitHub API" };
  }

  const { Octokit, RequestError } = await import("octokit");

  const { repositoryOwner, repositoryName, head, base, title, description } = params;

  const octokit = new Octokit({ auth: authParams.authToken });

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
