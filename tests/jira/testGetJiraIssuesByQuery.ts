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

  // Page 1
  const page1 = (await runAction(
    "getJiraIssuesByQuery",
    provider,
    getAuthParams(config),
    { query: jql, limit: 2 },
  )) as jiraGetJiraIssuesByQueryOutputType;

  console.log("Page 1:");
  console.dir(page1, { depth: 4 });

  assert.strictEqual(page1.error, undefined);
  assert.ok(page1.results && page1.results.length > 0, "page 1 should have results");
  assert.ok(page1.results[0].name, "first result should have a key");
  assert.ok(page1.results[0].url, "first result should have a url");
  assert.ok(page1.results[0].contents, "first result should have contents");
  assert.ok(
    Array.isArray(page1.results[0].contents.labels),
    "first result's contents should include a labels array (empty if the issue has no labels)",
  );

  // Pagination: if nextPageToken is present, fetch page 2
  if (page1.nextPageToken) {
    const page2Params = { query: jql, limit: 2, nextPageToken: page1.nextPageToken };

    const page2 = (await runAction(
      "getJiraIssuesByQuery",
      provider,
      getAuthParams(config),
      page2Params,
    )) as jiraGetJiraIssuesByQueryOutputType;

    console.log("Page 2:");
    console.dir(page2, { depth: 4 });

    assert.strictEqual(page2.error, undefined);
    assert.ok(page2.results && page2.results.length > 0, "page 2 should have results");

    // Keys on page 2 must not overlap with page 1
    const page1Keys = new Set(page1.results!.map(r => r.name));
    for (const r of page2.results!) {
      assert.ok(!page1Keys.has(r.name), `duplicate key ${r.name} returned on page 2`);
    }

    console.log(`Pagination OK: page1=${page1.results!.length} results, page2=${page2.results!.length} results, no duplicates`);
  } else {
    console.log("Project has <=2 issues, skipping page 2 check");
  }
}

runJiraTest("Get Jira Issues by Query", testGetJiraIssuesByQuery).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
