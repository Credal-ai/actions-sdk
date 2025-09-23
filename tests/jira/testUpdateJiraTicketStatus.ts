import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testUpdateJiraTicketStatus(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, projectKey, issueId, provider } = config;

  const authParams: { authToken: string; baseUrl: string; cloudId?: string } = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "updateJiraTicketStatus",
    provider,
    authParams,
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
  console.log(`✅ Successfully updated Jira ticket status: ${result.ticketUrl}`);
}

runJiraTest("Update Jira Ticket Status", testUpdateJiraTicketStatus).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
