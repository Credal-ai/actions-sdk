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

  const jql = `project = ${projectKey} ORDER BY created ASC`;

  const result = (await runAction(
    "getJiraIssuesByQuery",
    provider,
    getAuthParams(config),
    {
      query: jql,
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

  // Truncation signal: DC returns `total`, Cloud returns `truncated`.
  // With limit=2, a project with more than 2 issues should trigger one of these.
  if (provider === "jiraDataCenter") {
    assert.ok(typeof result.total === "number", "DC provider should return a numeric total");
  } else {
    // Cloud: truncated is true when limit was hit and more pages exist.
    // Only assert its type when present — a project with <=2 issues won't set it.
    if (result.truncated !== undefined) {
      assert.ok(typeof result.truncated === "boolean", "truncated should be a boolean");
    }
  }
}

runJiraTest("Get Jira Issues by Query", testGetJiraIssuesByQuery).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
