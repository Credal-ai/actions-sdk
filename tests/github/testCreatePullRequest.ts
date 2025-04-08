import dotenv from "dotenv";
import assert from "node:assert";
import { runAction } from "../../src/app";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const repositoryName = "actions-sdk";
  const sourceRepositoryOwner = "vintitres";
  const targetRepositoryOwner = "Credal-ai";
  const sourceBranch = "test"; // Ensure this branch exists in the source repository
  const pullBranch = `test-branch-${Date.now()}`; // Will create this branch in source repo and it will be used as the head branch for the PR
  const targetBranch = "main"; // Ensure this branch exists in the target repository

  const title = `Test Pull Request - ${new Date().toISOString()}`;
  const description = "This is a test pull request created by Credal SDK.";

  // Create a new branch to use as the source branch
  const branchResult = await runAction(
    "createBranch",
    "github",
    {
      authToken: authToken,
    },
    {
      repositoryOwner: sourceRepositoryOwner,
      repositoryName,
      branchName: pullBranch,
      baseRefOrHash: `heads/${sourceBranch}`, // Use the target branch as the base
    },
  );

  console.log(JSON.stringify(branchResult, null, 2));

  // Validate branch creation response
  assert(branchResult, "Branch creation response should not be null");
  assert(
    branchResult.success,
    "Branch creation response should indicate success",
  );
  console.log(`Successfully created branch: ${pullBranch}`);

  // Create a pull request
  const pullRequestResult = await runAction(
    "createPullRequest",
    "github",
    {
      authToken: authToken,
    },
    {
      repositoryOwner: targetRepositoryOwner,
      repositoryName,
      head: `${sourceRepositoryOwner}:${pullBranch}`,
      base: targetBranch,
      title,
      description,
    },
  );

  console.log(JSON.stringify(pullRequestResult, null, 2));

  // Validate pull request response
  assert(pullRequestResult, "Pull request response should not be null");
  assert(
    pullRequestResult.success,
    "Pull request response should indicate success",
  );
  assert(
    pullRequestResult.pullRequestUrl,
    "Pull request response should contain the pull request URL",
  );
  assert(
    pullRequestResult.pullRequestNumber,
    "Pull request response should contain the pull request number",
  );
  console.log(
    `Successfully created pull request. URL: ${pullRequestResult.pullRequestUrl}`,
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
