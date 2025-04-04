import assert from "node:assert";
import { runAction } from "../../src/app";
import { jiraConfig } from "./utils";

async function runTest() {
  const { authToken, cloudId, baseUrl, issueId } = jiraConfig;

  const result = await runAction(
    "getJiraTicketHistory",
    "jira",
    {
      authToken,
      cloudId,
      baseUrl,
    },
    {
      issueId,
    }
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.history), "Ticket history should be an array");

  console.log(`Successfully retrieved Jira ticket history for: ${issueId}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});