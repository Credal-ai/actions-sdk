import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { getAuthParams } from "./utils.js";

async function testUpdateJiraTicketStatus(config: JiraTestConfig) {
  const { projectKey, issueId, provider } = config;

  const result = await runAction(
    "updateJiraTicketStatus",
    provider,
    getAuthParams(config),
    {
      projectKey,
      issueId,
      status: "Done", // Adjust to a valid status for your workflow
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Status update should be successful");
  assert(result.ticketUrl, "Response should contain a ticket URL");
}

runJiraTest("Update Jira Ticket Status", testUpdateJiraTicketStatus).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
