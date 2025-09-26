import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { getAuthParams } from "./utils.js";

async function testAssignJiraTicket(config: JiraTestConfig) {
  const { issueId, assignee, projectKey, provider } = config;

  const result = await runAction(
    "assignJiraTicket",
    provider,
    getAuthParams(config),
    {
      projectKey,
      issueId: issueId,
      assignee: assignee,
    },
  );

  console.log('Result: ', JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(result.ticketUrl, "Response should contain a ticket URL");

  // Validate URL format based on provider type
  if (config.provider === "jiraDataCenter") {
    assert(
      result.ticketUrl.startsWith(config.baseUrl),
      `Data Center ticket URL should start with base URL: ${config.baseUrl}`,
    );
  } else {
    // For Cloud, it should contain the browse URL
    assert(
      result.ticketUrl.includes("/browse/"),
      "Cloud ticket URL should contain /browse/",
    );
  }
}

runJiraTest("Assign Jira Ticket", testAssignJiraTicket).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
