import type {
  AuthParamsType,
  githubListDirectoryFunction,
  githubListDirectoryOutputType,
  githubListDirectoryParamsType,
} from "../../autogen/types.js";

import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

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
  const { Octokit } = await import("octokit");

  if (!authParams.authToken) {
    return {
      success: false,
      error: MISSING_AUTH_TOKEN,
    };
  }

  const octokit = new Octokit({ auth: authParams.authToken });
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

  const content = data.map(item => {
    return {
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      htmlUrl: item.html_url ?? item.url,
    };
  });

  return {
    success: true,
    content,
  };
};

export default listDirectory;
