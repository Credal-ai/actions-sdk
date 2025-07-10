import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import type { githubGetFileContentOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "listPullRequests",
    "github",
    {
      authToken: "insert-during-test", // authParams
    },
    {
      repositoryOwner: "insert-during-test",
      repositoryName: "insert-during-test",
    }
  );

  const typedResult = result as githubGetFileContentOutputType;

  console.log(JSON.stringify(typedResult, null, 2));

  // Validate response
  assert(typedResult, "Response should not be null");
  assert(typedResult.success, "Response should indicate success");
  assert(
    typedResult.htmlUrl ==
      "https://github.com/Credal-ai/actions-sdk/blob/main/src/app.ts",
    "Response should contain the correct URL"
  );
  assert(
    typedResult.name == "app.ts",
    "Response should contain the correct name"
  );
  assert(
    typedResult.content?.includes("action"),
    "Response should contain the correct content"
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
