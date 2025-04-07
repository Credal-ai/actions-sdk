import assert from "node:assert";
import { runAction } from "../../src/app";
import { jiraConfig } from "./utils";

async function runTest() {
  const { authToken, cloudId, baseUrl, issueId } = jiraConfig;

  const result = await runAction(
    "getJiraTicketDetails",
    "jira",
    {
      authToken,
      cloudId,
      baseUrl,
    },
    {
      issueId,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.data, "Response should contain ticket data");
  assert(result.data.key, "Ticket data should include a key");
  assert(result.data.fields, "Ticket data should include fields");

  console.log(
    `Successfully retrieved Jira ticket details for: ${result.data.key}`,
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
