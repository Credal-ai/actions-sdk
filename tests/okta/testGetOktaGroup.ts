import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

async function runTest() {
  const oktaAuthToken = process.env.OKTA_AUTH_TOKEN;
  const oktaDomain = process.env.OKTA_DOMAIN; // e.g., https://yourdomain.okta.com
  const testGroupId = process.env.OKTA_TEST_GROUP_ID;

  if (!oktaAuthToken || !oktaDomain || !testGroupId) {
    console.warn(
      "OKTA_AUTH_TOKEN, OKTA_DOMAIN, or OKTA_TEST_GROUP_ID environment variables are not set. Skipping Okta tests."
    );
    return;
  }

  const authParams = { authToken: oktaAuthToken, baseUrl: oktaDomain };

  console.log("Running Okta getGroup test...");
  const result = await runAction("getOktaGroup", "okta", authParams, {
    groupId: testGroupId,
  });

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta API Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(result.group, "Response should contain a group object");
  assert(
    result.group.id === testGroupId,
    "Group ID should match the test group ID"
  );
  console.log("Retrieved group:", JSON.stringify(result.group, null, 2));

  console.log("Okta getGroup test completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testGetOktaGroup failed:", error.message);
  if (error.isAxiosError && error.response) {
    console.error(
      "Axios Response Error Data:",
      JSON.stringify(error.response.data, null, 2)
    );
    console.error("Axios Response Error Status:", error.response.status);
  } else if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
