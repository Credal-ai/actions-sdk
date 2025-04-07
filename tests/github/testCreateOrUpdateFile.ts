import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;
  const branch = "test"; // branch has to exist in the repo

  const fileName = `test-file-${Date.now()}-${Math.random().toString(36).slice(-5)}.txt`;

  const result = await runAction(
    "createOrUpdateFile",
    "github",
    {
      authToken: authToken,
    },
    {
      repositoryOwner: "vintitres",
      repositoryName: "actions-sdk",
      filePath: `testing/${fileName}`,
      branch,
      fileContent: `This is a test file created by Credal SDK - ${new Date().toISOString()}`,
      commitMessage: `Updating file via API - ${new Date().toISOString()}`,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.newCommitSha, "Response should contain the new commit SHA");
  assert(
    /^[a-f0-9]{40}$/.test(result.newCommitSha),
    "newCommitSha should be a valid SHA-1 hash",
  );
  assert(
    result.operation == "created",
    "Response should contain the operation type",
  );
  console.log(
    `Successfully created file. New commit SHA: ${result.newCommitSha}`,
  );

  // Update the same file with new content
  const updatedContent = `This is an updated test file created by Credal SDK - ${new Date().toISOString()}`;
  const updateResult = await runAction(
    "createOrUpdateFile",
    "github",
    {
      authToken: authToken,
    },
    {
      repositoryOwner: "vintitres",
      repositoryName: "actions-sdk",
      filePath: `testing/${fileName}`,
      branch,
      fileContent: updatedContent,
      commitMessage: `Updating file content via API - ${new Date().toISOString()}`,
    },
  );

  console.log(JSON.stringify(updateResult, null, 2));

  // Validate update response
  assert(updateResult, "Update response should not be null");
  assert(updateResult.success, "Update response should indicate success");
  assert(
    updateResult.newCommitSha,
    "Update response should contain the new commit SHA",
  );
  assert(
    /^[a-f0-9]{40}$/.test(updateResult.newCommitSha),
    "newCommitSha should be a valid SHA-1 hash",
  );
  assert(
    updateResult.operation == "updated",
    "Update response should contain the operation type",
  );
  console.log(
    `Successfully updated file. New commit SHA: ${updateResult.newCommitSha}`,
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
