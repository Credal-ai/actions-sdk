import assert from "node:assert";
import { runAction } from "../../src/app";
import { jiraConfig } from './utils'; 

async function runTest() {
  const { authToken, cloudId, baseUrl, projectKey, issueId } = jiraConfig;
  const result = await runAction(
    "commentJiraTicket",
    "jira",
    { 
      authToken,
      cloudId,
      baseUrl,
    },
    {
      projectKey,
      comment: `Test comment made on ${new Date().toISOString()}`,
      issueId: issueId,
    }
  );
  
  console.log(JSON.stringify(result, null, 2));
  
  // Validate response
  assert(result, "Response should not be null");
  assert(result.commentUrl, "Response should contain a url to the created comment");
  console.log(`Successfully created Jira comment: ${result.commentUrl}`);
}

runTest().catch(error => {
  console.error("Test failed:", error);
  if (error.response) {
    console.log('sad face');
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});