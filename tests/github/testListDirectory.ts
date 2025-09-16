import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import type { githubListDirectoryOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!authToken) {
    throw new Error("GITHUB_ACCESS_TOKEN is not set");
  }

  const result = await runAction(
    "listDirectory",
    "github",
    {
      authToken,
    },
    {
      organization: "Credal-ai",
      repository: "actions-sdk",
      path: "src",
    }
  );

  const typedResult = result as githubListDirectoryOutputType;

  console.log(JSON.stringify(typedResult, null, 2));

  // Validate response
  assert(typedResult, "Response should not be null");
  assert(typedResult.success, "Response should indicate success");
  assert(Array.isArray(typedResult.results), "Results should be an array");
  assert(typedResult.results.length > 0, "Results should not be empty");
  assert(typedResult.results.some((item) => item.name === "app.ts"));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
