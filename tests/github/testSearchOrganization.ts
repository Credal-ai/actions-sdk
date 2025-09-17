import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { type githubSearchOrganizationOutputType } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runSearchOrganizationWithoutRepository() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const result = (await runAction(
    "searchOrganization",
    "github",
    {
      authToken,
    },
    {
      organization: "Credal-ai",
      query: "test",
    }
  )) as githubSearchOrganizationOutputType;

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(Array.isArray(result.results), "Results should be an array");
}

async function runSearchOrganizationWithRepository() {
  const authToken = process.env.GITHUB_ACCESS_TOKEN;

  const result = (await runAction(
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
  )) as githubSearchOrganizationOutputType;

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(Array.isArray(result.results), "Results should be an array");
}

runSearchOrganizationWithoutRepository().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

runSearchOrganizationWithRepository().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
