import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testCreateJiraTicket(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, projectKey, requestTypeId, provider } = config;

  const authParams: {
    authToken: string;
    baseUrl: string;
    cloudId?: string;
  } = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "createJiraTicket",
    provider,
    authParams,
    {
      projectKey,
      summary: `Credal - Test Ticket ${new Date().toISOString()}`,
      description: `Credal - Test Ticket Description ${new Date().toISOString()}`,
      issueType: "Task", // Adjust based on available issue types in your Jira
      reporter: "", // Optional - (defaults to the authenticated user related to the oauth token)
      assignee: "", // Optional
      // customFields: { customfield_10100: "High" }, // Example of custom fields setting
      requestTypeId, // JSM request type from environment
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(
    result.ticketUrl,
    "Response should contain a url to the created ticket",
  );

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

  console.log(`✅ Successfully created Jira ticket: ${result.ticketUrl}`);
}

runJiraTest("Create Jira Ticket", testCreateJiraTicket).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
