import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import {
  jiraGetJiraIssuesByQueryOutputSchema,
  type jiraGetJiraIssuesByQueryOutputType,
} from "../../src/actions/autogen/types.js";
import { jiraConfig } from "./utils.js";

dotenv.config();

async function runTest() {
  const { authToken, cloudId, baseUrl, projectKey } = jiraConfig;

  const result = (await runAction(
    "getJiraIssuesByQuery",
    "jira",
    {
      authToken,
      cloudId,
      baseUrl,
    },
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
}

runTest().catch(console.error);
