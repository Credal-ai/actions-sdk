import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { jiraGetJiraIssuesByQueryOutputSchema } from "../../src/actions/autogen/types.js";
import { jiraConfig } from "./utils.js";

async function runTest() {
  const { authToken, cloudId, projectKey } = jiraConfig;

  const result = await runAction(
    "getJiraIssuesByQuery",
    "jira",
    {
      authToken,
      cloudId,
    },
    {
      query: `project = ${projectKey}`,
      limit: 10
    }
  );
  console.dir(result, { depth: 4 });
  assert.strictEqual(result.success, true);
  assert.equal(jiraGetJiraIssuesByQueryOutputSchema.safeParse(result).success, true);
}

runTest().catch(console.error);
