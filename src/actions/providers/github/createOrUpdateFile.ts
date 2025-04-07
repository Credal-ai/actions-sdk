import {
  AuthParamsType,
  githubCreateOrUpdateFileFunction,
  githubCreateOrUpdateFileOutputType,
  githubCreateOrUpdateFileParamsType,
} from "../../autogen/types";
import { Octokit, RequestError } from "octokit";
import { z } from "zod";

/**
 * Creates or updates a file in a GitHub repository
 */
const createOrUpdateFile: githubCreateOrUpdateFileFunction = async ({
  params,
  authParams,
}: {
  params: githubCreateOrUpdateFileParamsType;
  authParams: AuthParamsType;
}): Promise<githubCreateOrUpdateFileOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: "authToken is required for GitHub API" };
  }

  const { repositoryOwner, repositoryName, filePath, branch, fileContent, commitMessage } = params;

  const octokit = new Octokit({ auth: authParams.authToken });

  let fileSha = undefined;
  let operationPreformed = undefined;
  try {
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner: repositoryOwner,
      repo: repositoryName,
      path: filePath,
      ref: branch,
    });
    if (params.noOverwrite) {
      return { success: false, error: "Path already exists and noOverwrite is set to true." };
    }
    if (Array.isArray(fileData)) {
      console.error(`Error: Path is a directory, not a file. Path: ${filePath}`);
      return { success: false, error: `Path is a directory, not a file. Path: ${filePath}` };
    }
    fileSha = fileData.sha;
    operationPreformed = "updated";
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      console.log(`File not found, creating new file.`);
      operationPreformed = "created";
    } else {
      return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
    }
  }
  try {
    const { data: commitData } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: repositoryOwner,
      repo: repositoryName,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(fileContent).toString("base64"),
      branch,
      sha: fileSha,
    });

    const OperationEnum = z.enum(["created", "updated"]);

    return {
      success: true,
      newCommitSha: commitData.commit.sha,
      operation: OperationEnum.parse(operationPreformed),
    };
  } catch (error) {
    console.error("Error creating or updating file:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
};

export default createOrUpdateFile;
