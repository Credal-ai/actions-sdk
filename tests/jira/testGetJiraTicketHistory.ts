import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testGetJiraTicketHistory(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, issueId, projectKey, provider } = config;

  const authParams: Record<string, unknown> = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "getJiraTicketHistory",
    provider,
    authParams,
    {
      projectKey,
      issueId,
    },
  );

  console.log('Response: ', JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.history), "Ticket history should be an array");

}

runJiraTest("Get Jira Ticket History", testGetJiraTicketHistory).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
