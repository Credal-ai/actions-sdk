import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { jiraConfig, provider } from "./utils.js";

async function runTest() {
  const { authToken, cloudId, baseUrl, issueId, projectKey, requestTypeId } =
    jiraConfig;

  const validResult = await runAction(
    "updateJiraTicketDetails",
    provider,
    {
      authToken,
      cloudId,
      baseUrl,
    },
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
  console.log(`Successfully updated Jira ticket: ${validResult.ticketUrl}`);

  // Partial update (only summary, no description/custom fields)
  const partialUpdateResult = await runAction(
    "updateJiraTicketDetails",
    provider,
    {
      authToken,
      cloudId,
      baseUrl,
    },
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
    `Successfully updated Jira ticket with partial update: ${partialUpdateResult.ticketUrl}`,
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
