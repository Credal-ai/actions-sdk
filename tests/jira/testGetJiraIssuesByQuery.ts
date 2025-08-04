import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { jiraGetJiraIssuesByQueryOutputSchema } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.JIRA_AUTH_TOKEN;
  const cloudId = process.env.JIRA_CLOUD_ID;

  const result = await runAction(
    "getJiraIssuesByQuery",
    "jira",
    {
      authToken,
      cloudId,
    },
    {
      query: `project = CTP`,
      limit: 10
    }
  );
  console.dir(result, { depth: 4 });
  assert.strictEqual(result.success, true);
  assert.equal(jiraGetJiraIssuesByQueryOutputSchema.safeParse(result).success, true);
}

runTest().catch(console.error);
