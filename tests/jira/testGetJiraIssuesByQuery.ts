import assert from "node:assert";
import { runAction } from "../../src/app.js";
import {
  jiraGetJiraIssuesByQueryOutputSchema,
  type jiraGetJiraIssuesByQueryOutputType,
} from "../../src/actions/autogen/types.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { getAuthParams } from "./utils.js";

async function testGetJiraIssuesByQuery(config: JiraTestConfig) {
  const { projectKey, provider } = config;

  const result = (await runAction(
    "getJiraIssuesByQuery",
    provider,
    getAuthParams(config),
    {
      query: `project = ${projectKey}`,
      limit: 10
    },
  )) as jiraGetJiraIssuesByQueryOutputType;
  
  console.dir(result, { depth: 4 });
  assert.strictEqual(result.success, true);
  assert.equal(
    jiraGetJiraIssuesByQueryOutputSchema.safeParse(result).success,
    true
  );

}

runJiraTest("Get Jira Issues by Query", testGetJiraIssuesByQuery).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
