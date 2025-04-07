import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const result = await runAction(
    "createBranch",
    "github",
    {
      authToken,
    },
    {
      repositoryOwner: "vintitres",
      repositoryName: "actions-sdk",
      branchName: `test-branch-${Date.now()}`,
      baseRefOrHash: "heads/main",
    }
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
