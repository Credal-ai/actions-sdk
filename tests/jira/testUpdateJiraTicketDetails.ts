import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testUpdateJiraTicketDetails(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, issueId, projectKey, requestTypeId, provider } = config;

  // Build auth params - only include cloudId for Cloud provider
  const authParams: Record<string, unknown> = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const validResult = await runAction(
    "updateJiraTicketDetails",
    provider,
    authParams,
    {
      projectKey,
      issueId,
      summary: "Updated Summary",
      description: `Updated description made on ${new Date().toISOString()}`,
      requestTypeId, // JSM request type from environment
    },
  );

  // Validate successful response
  assert(validResult, "Response should not be null");
  assert(
    validResult.ticketUrl,
    "Response should contain a URL to the updated ticket",
  );
  console.log(`✅ Successfully updated Jira ticket: ${validResult.ticketUrl}`);

  // Partial update (only summary, no description/custom fields)
  const partialUpdateResult = await runAction(
    "updateJiraTicketDetails",
    provider,
    authParams,
    {
      projectKey,
      issueId,
      summary: "Partially Updated Summary",
    },
  );

  // Validate successful response
  assert(partialUpdateResult, "Response should not be null");
  assert(
    partialUpdateResult.ticketUrl,
    "Response should contain a URL to the updated ticket",
  );
  console.log(
    `✅ Successfully updated Jira ticket with partial update: ${partialUpdateResult.ticketUrl}`,
  );
}

runJiraTest("Update Jira Ticket Details", testUpdateJiraTicketDetails).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
