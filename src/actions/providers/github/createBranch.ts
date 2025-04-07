import {
  AuthParamsType,
  githubCreateBranchFunction,
  githubCreateBranchOutputType,
  githubCreateBranchParamsType,
} from "../../autogen/types";

/**
 * Creates a new branch in a GitHub repository
 */
const createBranch: githubCreateBranchFunction = async ({
  params,
  authParams,
}: {
  params: githubCreateBranchParamsType;
  authParams: AuthParamsType;
}): Promise<githubCreateBranchOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: "authToken is required for GitHub API" };
  }
  const { Octokit, RequestError} = await import("octokit");

  const { repositoryOwner, repositoryName, branchName, baseRefOrHash } = params;

  const octokit = new Octokit({ auth: authParams.authToken });

  try {
    // Get the reference or commit SHA for the base branch or tag
    const { data: baseRefData } = await octokit.rest.git
      .getRef({
        owner: repositoryOwner,
        repo: repositoryName,
        ref: baseRefOrHash,
      })
      .catch(async (error: InstanceType<typeof RequestError>) => {
        if (error.status === 404 && /^[a-f0-9]{40}$/i.test(baseRefOrHash)) {
          // If baseRef is a full commit SHA and not a ref, use it directly
          return { data: { object: { sha: baseRefOrHash } } };
        } else if (error.status === 404 && /^[a-f0-9]{7,39}$/i.test(baseRefOrHash)) {
          // If baseRef is a short commit SHA, try to resolve it to a full SHA
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner: repositoryOwner,
            repo: repositoryName,
            sha: baseRefOrHash,
            per_page: 1,
          });
          if (commits.length > 0) {
            return { data: { object: { sha: commits[0].sha } } };
          }
        }
        throw error;
      });

    // Create a new branch from the base reference
    await octokit.rest.git.createRef({
      owner: repositoryOwner,
      repo: repositoryName,
      ref: `refs/heads/${branchName}`,
      sha: baseRefData.object.sha,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RequestError) {
      console.error("GitHub API error:", error.message);
      return { success: false, error: error.message };
    }
    console.error("Unexpected error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
};

export default createBranch;
