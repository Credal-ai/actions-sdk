import assert from "node:assert";
import { runAction } from "../../src/app.js";
import type { JiraTestConfig } from "./utils.js";
import { runJiraTest } from "./testRunner.js";
import { jiraCreateServiceDeskRequestOutputSchema } from "../../src/actions/autogen/types.js";

async function testCreateServiceDeskRequest(config: JiraTestConfig) {
  const { authToken, cloudId, baseUrl, serviceDeskId, requestTypeId, provider } = config;

  // Build auth params - only include cloudId for Cloud provider
  const authParams: Record<string, unknown> = {
    authToken,
    baseUrl,
  };

  if (cloudId) {
    authParams.cloudId = cloudId;
  }

  const result = await runAction(
    "createServiceDeskRequest",
    provider,
    authParams,
    {
      serviceDeskId,
      requestTypeId,
      summary: "Test Summary",
      description: "Test Description",
    //   reporter: "Test Reporter",
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  console.dir(result, { depth: 4 });

  const validatedResult = jiraCreateServiceDeskRequestOutputSchema.safeParse(result);
  assert(validatedResult.success, "Response should be valid");

  console.log(
    `✅ Successfully created Jira service desk request`,
  );
}

runJiraTest("Create Service Desk Request", testCreateServiceDeskRequest).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
