import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { getAuthParams } from "./utils.js";

async function testUpdateJiraTicketDetails(config: JiraTestConfig) {
  const { issueId, projectKey, requestTypeId, provider } = config;

  const validResult = await runAction(
    "updateJiraTicketDetails",
    provider,
    getAuthParams(config),
    {
      projectKey,
      issueId,
      summary: "Updated Summary",
      description: `Updated description made on ${new Date().toISOString()}`,
      requestTypeId, // JSM request type from environment
    },
  );

  console.log("Update result:", JSON.stringify(validResult, null, 2));

  // Validate successful response
  assert(validResult, "Response should not be null");
  assert(
    validResult.ticketUrl,
    "Response should contain a URL to the updated ticket",
  );

  // Partial update (only summary, no description/custom fields)
  const partialUpdateResult = await runAction(
    "updateJiraTicketDetails",
    provider,
    getAuthParams(config),
    {
      projectKey,
      issueId,
      summary: "Partially Updated Summary",
      // customFields: { customfield_10200: "High" }, // Example of custom fields setting
    },
  );

  console.log("Partial update result:", JSON.stringify(partialUpdateResult, null, 2));

  // Validate successful response
  assert(partialUpdateResult, "Response should not be null");
  assert(
    partialUpdateResult.ticketUrl,
    "Response should contain a URL to the updated ticket",
  );
}

runJiraTest("Update Jira Ticket Details", testUpdateJiraTicketDetails).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
