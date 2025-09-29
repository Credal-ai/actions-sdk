import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { oktaTriggerOktaWorkflowParamsType } from "../../src/actions/autogen/types.js";

dotenv.config(); // Load .env file

async function runTest() {
  const oktaAuthToken = "insert-during-test"; //
  const oktaDomain = "insert-during-test"; // e.g., https://yourdomain.okta.com
  const workflowId = "insert-during-test";

  if (!oktaAuthToken || !oktaDomain || !workflowId) {
    console.warn(
      "OKTA_AUTH_TOKEN, OKTA_DOMAIN, or OKTA_TEST_HTTP_TRIGGER_CARD environment variables are not set. Skipping Okta workflow trigger test.",
    );
    return;
  }

  // Extract subdomain from domain URL
  const subdomain = oktaDomain
    .replace(/https?:\/\//, "")
    .replace(".okta.com", "");
  const authParams = { authToken: oktaAuthToken, subdomain };

  console.log("Running Okta triggerWorkflow test...");

  // Test with workflow parameters
  const testParams: oktaTriggerOktaWorkflowParamsType = {
    workflowId,
    workflowParameters: {
      testParam1: "testValue1",
      testParam2: "testValue2",
    },
  };

  const result = await runAction(
    "triggerOktaWorkflow",
    "okta",
    authParams,
    testParams,
  );

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta Workflow Trigger Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(result.output !== undefined, "Response should contain output");

  console.log(
    "Workflow trigger result:",
    JSON.stringify(result.output, null, 2),
  );

  console.log("Okta triggerWorkflow test completed successfully.");

  // Test without workflow parameters
  console.log("Running Okta triggerWorkflow test without parameters...");

  const testParamsWithoutWorkflowParams: oktaTriggerOktaWorkflowParamsType = {
    workflowId,
  };

  const resultWithoutParams = await runAction(
    "triggerOktaWorkflow",
    "okta",
    authParams,
    testParamsWithoutWorkflowParams,
  );

  assert(resultWithoutParams, "Response should not be null");

  if (!resultWithoutParams.success) {
    console.error(
      "Okta Workflow Trigger Error (no params):",
      resultWithoutParams.error,
    );
  }
  assert(
    resultWithoutParams.success,
    `Action should be successful. Error: ${resultWithoutParams.error}`,
  );

  console.log(
    "Workflow trigger result (no params):",
    JSON.stringify(resultWithoutParams.output, null, 2),
  );

  console.log("Okta triggerWorkflow test (no params) completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testTriggerOktaWorkflow failed:", error.message);
  if (error.isAxiosError && error.response) {
    console.error(
      "Axios Response Error Data:",
      JSON.stringify(error.response.data, null, 2),
    );
    console.error("Axios Response Error Status:", error.response.status);
  } else if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
