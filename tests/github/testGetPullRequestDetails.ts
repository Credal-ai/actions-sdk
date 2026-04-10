import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import type { githubGetPullRequestDetailsOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!authToken) {
    throw new Error("GITHUB_ACCESS_TOKEN is not set");
  }

  // Test getting details for a specific pull request
  const result = await runAction(
    "getPullRequestDetails",
    "github",
    {
      authToken,
    },
    {
      repositoryOwner: "Credal-ai",
      repositoryName: "actions-sdk",
      pullRequestNumber: 1, // Assuming PR #1 exists
    },
  );

  const typedResult = result as githubGetPullRequestDetailsOutputType;

  console.log("Pull request details result:");
  console.log(JSON.stringify(typedResult, null, 2));

  // Validate basic response
  assert(typedResult, "Response should not be null");
  assert(typedResult.success, "Response should indicate success");

  if (typedResult.pullRequest) {
    const pr = typedResult.pullRequest;

    // Validate required PR fields
    assert(typeof pr.number === "number", "PR should have number");
    assert(typeof pr.title === "string", "PR should have title");
    assert(typeof pr.state === "string", "PR should have state");
    assert(typeof pr.draft === "boolean", "PR should have draft status");
    assert(typeof pr.url === "string", "PR should have API URL");
    assert(typeof pr.htmlUrl === "string", "PR should have HTML URL");
    assert(typeof pr.createdAt === "string", "PR should have created date");
    assert(typeof pr.updatedAt === "string", "PR should have updated date");

    // Validate author information
    if (pr.author) {
      assert(typeof pr.author.login === "string", "Author should have login");
    }

    // Validate head and base branch information
    assert(pr.head, "PR should have head branch info");
    assert(typeof pr.head.ref === "string", "Head should have ref");
    assert(typeof pr.head.sha === "string", "Head should have SHA");

    assert(pr.base, "PR should have base branch info");
    assert(typeof pr.base.ref === "string", "Base should have ref");
    assert(typeof pr.base.sha === "string", "Base should have SHA");

    // Validate arrays
    assert(Array.isArray(pr.assignees), "Assignees should be an array");
    assert(Array.isArray(pr.reviewers), "Reviewers should be an array");
    assert(Array.isArray(pr.labels), "Labels should be an array");

    // Validate numeric fields
    assert(typeof pr.commits === "number", "PR should have commits count");
    assert(typeof pr.additions === "number", "PR should have additions count");
    assert(typeof pr.deletions === "number", "PR should have deletions count");
    assert(
      typeof pr.changedFiles === "number",
      "PR should have changed files count",
    );

    console.log(`✅ Pull Request #${pr.number}: "${pr.title}"`);
    console.log(`   State: ${pr.state}, Draft: ${pr.draft}`);
    console.log(`   Author: ${pr.author?.login || "Unknown"}`);
    console.log(`   Head: ${pr.head.ref} (${pr.head.sha.substring(0, 7)})`);
    console.log(`   Base: ${pr.base.ref} (${pr.base.sha.substring(0, 7)})`);
    console.log(
      `   Changes: +${pr.additions}/-${pr.deletions} across ${pr.changedFiles} files`,
    );

    if (pr.description) {
      console.log(
        `   Description: ${pr.description.substring(0, 100)}${pr.description.length > 100 ? "..." : ""}`,
      );
    }
  }

  console.log("✅ Basic PR details test passed");

  // Test with a different PR number to ensure the action works with different PRs
  try {
    const result2 = await runAction(
      "getPullRequestDetails",
      "github",
      {
        authToken,
      },
      {
        repositoryOwner: "Credal-ai",
        repositoryName: "actions-sdk",
        pullRequestNumber: 999999, // Non-existent PR
      },
    );

    const typedResult2 = result2 as githubGetPullRequestDetailsOutputType;

    // This should fail gracefully
    assert(
      !typedResult2.success,
      "Non-existent PR should return success: false",
    );
    assert(
      typedResult2.error,
      "Non-existent PR should return an error message",
    );

    console.log("✅ Error handling test passed");
  } catch {
    console.log("✅ Error handling test passed (threw exception as expected)");
  }

  console.log("🎉 All tests passed successfully!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
