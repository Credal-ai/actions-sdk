import assert from "node:assert";
import { runAction } from "../../src/app";
import { jiraConfig } from "./utils";

async function runTest() {
  const { authToken, cloudId, baseUrl, issueId, assignee } = jiraConfig;

  const result = await runAction(
    "assignJiraTicket",
    "jira",
    {
      authToken,
      cloudId,
      baseUrl,
    },
    {
      issueId: issueId,
      assignee: assignee,
    }
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(result.ticketUrl, "Response should contain a ticket URL");
  console.log(`Successfully assigned Jira ticket: ${result.ticketUrl}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});