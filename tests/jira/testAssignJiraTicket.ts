import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testAssignJiraTicket(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, issueId, assignee, projectKey, provider } = config;

  const authParams: { authToken: string; baseUrl: string; cloudId?: string } = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "assignJiraTicket",
    provider,
    authParams,
    {
      projectKey,
      issueId: issueId,
      assignee: assignee,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(result.ticketUrl, "Response should contain a ticket URL");

  // Validate URL format based on provider type
  if (config.provider === "jiraDataCenter") {
    assert(
      result.ticketUrl.startsWith(baseUrl),
      `Data Center ticket URL should start with base URL: ${baseUrl}`,
    );
  } else {
    // For Cloud, it should contain the browse URL
    assert(
      result.ticketUrl.includes("/browse/"),
      "Cloud ticket URL should contain /browse/",
    );
  }

  console.log(`✅ Successfully assigned Jira ticket: ${result.ticketUrl}`);
}

runJiraTest("Assign Jira Ticket", testAssignJiraTicket).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
