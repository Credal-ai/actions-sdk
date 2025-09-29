import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import type { githubListCommitsOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!authToken) {
    throw new Error("GITHUB_ACCESS_TOKEN is not set");
  }

  // Test basic listing
  const result = await runAction(
    "listCommits",
    "github",
    {
      authToken,
    },
    {
      repositoryOwner: "Credal-ai",
      repositoryName: "actions-sdk",
      perPage: 5, // Limit for testing
    },
  );

  const typedResult = result as githubListCommitsOutputType;

  console.log("Basic listing result:");
  console.log(JSON.stringify(typedResult, null, 2));

  // Validate basic response
  assert(typedResult, "Response should not be null");
  assert(typedResult.success, "Response should indicate success");
  assert(
    Array.isArray(typedResult.commits),
    "Response should contain commits array",
  );
  assert(
    typedResult.commits.length > 0,
    "Response should contain at least one commit",
  );
  assert(
    typeof typedResult.totalCount === "number",
    "Response should contain totalCount",
  );
  assert(
    typeof typedResult.hasMore === "boolean",
    "Response should contain hasMore",
  );

  // Validate commit structure
  const firstCommit = typedResult.commits[0];
  assert(firstCommit.sha, "Commit should have SHA");
  assert(firstCommit.url, "Commit should have URL");
  assert(firstCommit.htmlUrl, "Commit should have HTML URL");
  assert(firstCommit.commit.message, "Commit should have message");
  assert(firstCommit.commit.author.name, "Commit should have author name");
  assert(firstCommit.commit.author.email, "Commit should have author email");
  assert(firstCommit.commit.author.date, "Commit should have author date");

  console.log("✅ Basic listing test passed");

  // Test with date filtering
  const dateFilterResult = await runAction(
    "listCommits",
    "github",
    {
      authToken,
    },
    {
      repositoryOwner: "Credal-ai",
      repositoryName: "actions-sdk",
      since: "2024-01-01T00:00:00Z",
      perPage: 3,
    },
  );

  const typedDateResult = dateFilterResult as githubListCommitsOutputType;

  console.log("Date filter result:");
  console.log(JSON.stringify(typedDateResult, null, 2));

  // Validate date filter response
  assert(
    typedDateResult.success,
    "Date filter response should indicate success",
  );
  assert(
    Array.isArray(typedDateResult.commits),
    "Date filter response should contain commits array",
  );

  console.log("✅ Date filtering test passed");

  // Test pagination
  const paginationResult = await runAction(
    "listCommits",
    "github",
    {
      authToken,
    },
    {
      repositoryOwner: "Credal-ai",
      repositoryName: "actions-sdk",
      perPage: 2,
      page: 2,
    },
  );

  const typedPaginationResult = paginationResult as githubListCommitsOutputType;

  console.log("Pagination result:");
  console.log(JSON.stringify(typedPaginationResult, null, 2));

  // Validate pagination response
  assert(
    typedPaginationResult.success,
    "Pagination response should indicate success",
  );
  assert(
    Array.isArray(typedPaginationResult.commits),
    "Pagination response should contain commits array",
  );

  console.log("✅ Pagination test passed");
  console.log("🎉 All tests passed successfully!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
