import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const result = await runAction(
    "searchRepository",
    "github",
    {
      authToken,
    },
    {
      organization: "flatiron-intl",
      repository: "intl-analytics",
      query: "breast cancer biomarker OR biomarker OR breast cancer OR marker",
    }
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(Array.isArray(result.code), "Code should be an array");
  assert(Array.isArray(result.commits), "Commits should be an array");
  assert(
    Array.isArray(result.issuesAndPullRequests),
    "Issues and pull requests should be an array"
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
