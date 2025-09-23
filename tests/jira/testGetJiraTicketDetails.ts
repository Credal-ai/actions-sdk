import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import type { jiraGetJiraTicketDetailsOutputType } from "../../src/actions/autogen/types";

async function testGetJiraTicketDetails(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, issueId, projectKey, provider } = config;

  interface AuthParams {
    authToken: string;
    baseUrl: string;
    cloudId?: string;
  }

  const authParams: AuthParams = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = (await runAction(
    "getJiraTicketDetails",
    provider,
    authParams,
    {
      projectKey,
      issueId,
    }
  )) as jiraGetJiraTicketDetailsOutputType;

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.results, "Response should contain ticket data");
  assert(result.results[0].contents.key, "Ticket data should include a key");
  assert(
    result.results[0].contents.fields,
    "Ticket data should include fields"
  );

  console.log(
    `✅ Successfully retrieved Jira ticket details for: ${result.results[0].name}`
  );
}

runJiraTest("Get Jira Ticket Details", testGetJiraTicketDetails).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
