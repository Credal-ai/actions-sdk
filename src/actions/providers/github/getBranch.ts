import type {
  AuthParamsType,
  githubGetBranchFunction,
  githubGetBranchOutputType,
  githubGetBranchParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getOctokit } from "./utils.js";

/**
 * Get a branch in a GitHub repository
 * https://docs.github.com/en/rest/branches/branches?apiVersion=2022-11-28#get-a-branch
 */
const getBranch: githubGetBranchFunction = async ({
  params,
  authParams,
}: {
  params: githubGetBranchParamsType;
  authParams: AuthParamsType;
}): Promise<githubGetBranchOutputType> => {
  if (!authParams.authToken) {
    return {
      success: false,
      error: MISSING_AUTH_TOKEN,
    };
  }

  const octokit = await getOctokit(authParams.authToken);
  const { repositoryOwner, repositoryName, branchName } = params;

  try {
    const response = await octokit.rest.repos.getBranch({
      owner: repositoryOwner,
      repo: repositoryName,
      branch: branchName,
    });

    return {
      success: true,
      branch: {
        name: response.data.name,
        commit: {
          sha: response.data.commit.sha,
          node_id: response.data.commit.node_id,
          url: response.data.commit.url,
          html_url: response.data.commit.html_url,
          comments_url: response.data.commit.comments_url,
          commit: {
            author: response.data.commit.commit.author,
            committer: response.data.commit.commit.committer,
            message: response.data.commit.commit.message,
            tree: response.data.commit.commit.tree,
            url: response.data.commit.commit.url,
            comment_count: response.data.commit.commit.comment_count,
          },
          author: response.data.commit.author,
          committer: response.data.commit.committer,
          parents: response.data.commit.parents,
        },
        _links: response.data._links,
        protected: response.data.protected,
        protection: response.data.protection,
        protection_url: response.data.protection_url,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: `Failed to get branch: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export default getBranch;
