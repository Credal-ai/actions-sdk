import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { jiraConfig } from "./utils.js";
import { jiraCreateServiceDeskRequestOutputSchema } from "../../src/actions/autogen/types.js";

async function runTest() {
  const { authToken, cloudId, baseUrl, serviceDeskId, requestTypeId } =
    jiraConfig;

  const result = await runAction(
    "createServiceDeskRequest",
    "jira",
    {
      authToken,
      cloudId,
      baseUrl,
    },
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

  const validatedResult =
    jiraCreateServiceDeskRequestOutputSchema.safeParse(result);
  assert(validatedResult.success, "Response should be valid");

  console.log(`Successfully created Jira service desk request`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
