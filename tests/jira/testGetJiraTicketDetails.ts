import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { jiraConfig, provider } from "./utils.js";
import type { jiraGetJiraTicketDetailsOutputType } from "../../src/actions/autogen/types";

async function runTest() {
  const { authToken, cloudId, baseUrl, issueId } = jiraConfig;

  const result = (await runAction(
    "getJiraTicketDetails",
    provider,
    {
      authToken,
      cloudId,
      baseUrl,
    },
    {
      issueId,
    },
  )) as jiraGetJiraTicketDetailsOutputType;

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.results, "Response should contain ticket data");
  assert(result.results[0].contents.key, "Ticket data should include a key");
  assert(
    result.results[0].contents.fields,
    "Ticket data should include fields",
  );

  console.log(
    `Successfully retrieved Jira ticket details for: ${result.results[0].name}`,
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
