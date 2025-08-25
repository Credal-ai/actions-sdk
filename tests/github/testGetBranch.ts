import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import type { githubGetBranchOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!authToken) {
    throw new Error("GITHUB_ACCESS_TOKEN is not set");
  }

  const result = await runAction(
    "getBranch",
    "github",
    {
      authToken,
    },
    {
      repositoryOwner: "Credal-ai",
      repositoryName: "actions-sdk",
      branchName: "main",
    }
  );

  const typedResult = result as githubGetBranchOutputType;

  console.log(JSON.stringify(typedResult, null, 2));

  // Validate response
  assert(typedResult, "Response should not be null");
  assert(typedResult.success, "Response should indicate success");
  assert(
    typedResult.branch?.name === "main",
    "Response should contain the correct branch name"
  );
  assert(
    typedResult.branch?.commit?.sha,
    "Response should contain a commit SHA"
  );
  assert(
    typedResult.branch?.commit?.url,
    "Response should contain a commit URL"
  );
  assert(
    typedResult.branch?.commit?.html_url,
    "Response should contain a commit HTML URL"
  );
  assert(
    typedResult.branch?.commit?.commit?.message,
    "Response should contain a commit message"
  );
  assert(
    typeof typedResult.branch?.protected === "boolean",
    "Response should indicate if branch is protected"
  );
  assert(typedResult.branch?._links?.html, "Response should contain HTML link");

  console.log("✅ getBranch test passed!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
