import type {
  AuthParamsType,
  githubListDirectoryFunction,
  githubListDirectoryOutputType,
  githubListDirectoryParamsType,
} from "../../autogen/types.js";

import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getOctokit } from "./utils.js";

/**
 * List directory contents
 */
const listDirectory: githubListDirectoryFunction = async ({
  params,
  authParams,
}: {
  params: githubListDirectoryParamsType;
  authParams: AuthParamsType;
}): Promise<githubListDirectoryOutputType> => {
  if (!authParams.authToken) {
    return {
      success: false,
      error: MISSING_AUTH_TOKEN,
    };
  }

  const octokit = await getOctokit(authParams.authToken);
  const { organization, repository, path } = params;

  const contentResponse = await octokit.rest.repos.getContent({
    owner: organization,
    repo: repository,
    path,
    headers: {
      accept: "application/vnd.github.v3.text-match+json",
    },
  });

  const data = contentResponse.data;

  if (!Array.isArray(data)) {
    return {
      success: false,
      error: "Content is not a directory",
    };
  }

  return {
    success: true,
    results: data.map(item => ({
      name: item.name,
      url: item.html_url ?? item.url,
      contents: {
        path: item.path,
        type: item.type,
        size: item.size,
      },
    })),
  };
};

export default listDirectory;
