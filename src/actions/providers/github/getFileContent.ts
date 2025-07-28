import type {
  AuthParamsType,
  githubGetFileContentFunction,
  githubGetFileContentOutputType,
  githubGetFileContentParamsType,
} from "../../autogen/types.js";

import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getOctokit } from "./utils.js";

/**
 * Get file content
 */
const getFileContent: githubGetFileContentFunction = async ({
  params,
  authParams,
}: {
  params: githubGetFileContentParamsType;
  authParams: AuthParamsType;
}): Promise<githubGetFileContentOutputType> => {
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

  if (Array.isArray(data)) {
    return {
      success: false,
      error: "Path is a directory. Use the directory list tool instead.",
    };
  }

  if (data.type !== "file") {
    return {
      success: false,
      error: `Content is not a file. Type: ${data.type}`,
    };
  }

  // GitHub API returns content as base64 encoded string
  // We need to decode it properly to UTF-8 text
  const content = Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf-8");

  return {
    success: true,
    content,
    size: data.size,
    name: data.name,
    htmlUrl: data.html_url ?? data.url,
  };
};

export default getFileContent;
