import assert from "node:assert";
import { runAction } from "../../src/app.js";
import {
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
      limit: 2,
    },
  )) as jiraGetJiraIssuesByQueryOutputType;
  
  console.dir(result, { depth: 4 });

  assert.strictEqual(result.error, undefined);
  assert.ok(result.results);
  assert.ok(result.results.length > 0);

  // Check first result has required fields
  const firstResult = result.results[0];
  assert.ok(firstResult.name);
  assert.ok(firstResult.url);
  assert.ok(firstResult.contents);
}

runJiraTest("Get Jira Issues by Query", testGetJiraIssuesByQuery).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
