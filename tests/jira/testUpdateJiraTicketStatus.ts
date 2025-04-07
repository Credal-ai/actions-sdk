import assert from "node:assert";
import { runAction } from "../../src/app";
import { jiraConfig } from "./utils";

async function runTest() {
  const { authToken, cloudId, baseUrl, projectKey, issueId } = jiraConfig;

  const result = await runAction(
    "updateJiraTicketStatus",
    "jira",
    { authToken, cloudId, baseUrl },
    {
      projectKey,
      issueId,
      status: "In Progress", // Adjust to a valid status for your workflow
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Status update should be successful");
  assert(result.ticketUrl, "Response should contain a ticket URL");
  console.log(`Successfully updated Jira ticket status: ${result.ticketUrl}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
