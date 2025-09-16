import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import type { githubGetFileContentOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!authToken) {
    throw new Error("GITHUB_ACCESS_TOKEN is not set");
  }

  const result = await runAction(
    "getFileContent",
    "github",
    {
      authToken,
    },
    {
      organization: "Credal-ai",
      repository: "actions-sdk",
      path: "src/app.ts",
    }
  );

  const typedResult = result as githubGetFileContentOutputType;

  console.log(JSON.stringify(typedResult, null, 2));

  // Validate response
  assert(typedResult, "Response should not be null");
  assert(typedResult.success, "Response should indicate success");
  assert(
    typedResult.results?.[0]?.contents?.htmlUrl ==
      "https://github.com/Credal-ai/actions-sdk/blob/main/src/app.ts",
    "Response should contain the correct URL"
  );
  assert(
    typedResult.results?.[0]?.name == "app.ts",
    "Response should contain the correct name"
  );
  assert(
    typedResult.results?.[0]?.contents?.content?.includes("action"),
    "Response should contain the correct content"
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
