import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

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

  console.log(JSON.stringify(result, null, 2));

  // TODO add logical tests

  // Validate response
  assert(result, "Response should not be null");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
