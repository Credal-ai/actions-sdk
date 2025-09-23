import assert from "node:assert";
import { runAction } from "../../src/app.js";
import {
  jiraGetJiraIssuesByQueryOutputSchema,
  type jiraGetJiraIssuesByQueryOutputType,
} from "../../src/actions/autogen/types.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testGetJiraIssuesByQuery(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, projectKey, provider } = config;

  // Build auth params - only include cloudId for Cloud provider
  const authParams: { authToken: string; baseUrl: string; cloudId?: string } = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = (await runAction(
    "getJiraIssuesByQuery",
    provider,
    authParams,
    {
      query: `project = ${projectKey}`,
      limit: 10
    }
  )) as jiraGetJiraIssuesByQueryOutputType;
  console.dir(result, { depth: 4 });
  assert.strictEqual(result.success, true);
  assert.equal(
    jiraGetJiraIssuesByQueryOutputSchema.safeParse(result).success,
    true
  );

  console.log(`✅ Successfully retrieved Jira issues by query for project: ${projectKey}`);
}

runJiraTest("Get Jira Issues by Query", testGetJiraIssuesByQuery).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
