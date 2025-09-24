import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { getAuthParams } from "./utils.js";
import type { jiraGetJiraTicketDetailsOutputType } from "../../src/actions/autogen/types";

async function testGetJiraTicketDetails(config: JiraTestConfig) {
  const { issueId, projectKey, provider } = config;

  const result = (await runAction(
    "getJiraTicketDetails",
    provider,
    getAuthParams(config),
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

}

runJiraTest("Get Jira Ticket Details", testGetJiraTicketDetails).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
