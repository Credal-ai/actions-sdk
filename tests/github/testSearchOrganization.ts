import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runSearchOrganizationWithoutRepository() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const result = await runAction(
    "searchOrganization",
    "github",
    {
      authToken,
    },
    {
      organization: "Credal-ai",
      query: "test",
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

async function runSearchOrganizationWithRepository() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const result = await runAction(
    "searchOrganization",
    "github",
    {
      authToken,
    },
    {
      organization: "Credal-ai",
      repository: "app",
      query: "test",
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

runSearchOrganizationWithoutRepository().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

runSearchOrganizationWithRepository().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
