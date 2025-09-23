import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";

async function testPublicCommentOnServiceDeskRequest(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, issueId, provider } = config;

  // Build auth params - only include cloudId for Cloud provider
  const authParams: Record<string, unknown> = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "publicCommentOnServiceDeskRequest",
    provider,
    authParams,
    {
      comment: `Test comment made on ${new Date().toISOString()}`,
      issueId: issueId,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(
    result.commentUrl,
    "Response should contain a url to the created comment",
  );
  console.log(`✅ Successfully created Jira comment: ${result.commentUrl}`);
}

runJiraTest("Public Comment on Service Desk Request", testPublicCommentOnServiceDeskRequest).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
