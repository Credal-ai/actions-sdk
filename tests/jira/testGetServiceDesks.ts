import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { jiraGetServiceDesksOutputSchema } from "../../src/actions/autogen/types.js";

async function testGetServiceDesks(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, provider } = config;

  // Build auth params - only include cloudId for Cloud provider
  const authParams: Record<string, unknown> = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "getServiceDesks",
    provider,
    authParams,
    {},
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  console.dir(result, { depth: 4 });

  const validatedResult = jiraGetServiceDesksOutputSchema.safeParse(result);
  assert(validatedResult.success, "Response should be valid");

  console.log(
    `✅ Successfully retrieved Jira service desks`,
  );
}

runJiraTest("Get Service Desks", testGetServiceDesks).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
