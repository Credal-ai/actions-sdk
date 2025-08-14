import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { jiraConfig } from "./utils.js";
import { jiraGetServiceDesksOutputSchema } from "../../src/actions/autogen/types.js";

async function runTest() {
  const { authToken, cloudId, baseUrl } = jiraConfig;

  const result = await runAction(
    "getServiceDesks",
    "jira",
    {
      authToken,
      cloudId,
      baseUrl,
    },
    {},
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  console.dir(result, { depth: 4 });

  const validatedResult = jiraGetServiceDesksOutputSchema.safeParse(result);
  assert(validatedResult.success, "Response should be valid");

  console.log(
    `Successfully retrieved Jira service desks`,
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
