import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

async function runTest() {
  const oktaAuthToken = process.env.OKTA_AUTH_TOKEN;
  const oktaDomain = process.env.OKTA_DOMAIN; // e.g., https://yourdomain.okta.com
  const testUserId = process.env.OKTA_TEST_USER_ID;

  if (!oktaAuthToken || !oktaDomain || !testUserId) {
    console.warn(
      "OKTA_AUTH_TOKEN, OKTA_DOMAIN, or OKTA_TEST_USER_ID environment variables are not set. Skipping Okta tests."
    );
    return;
  }

  const authParams = { authToken: oktaAuthToken, baseUrl: oktaDomain };

  console.log("Running Okta listUserGroups test...");
  const result = await runAction("listOktaUserGroups", "okta", authParams, {
    userId: testUserId,
    maxResults: 50, // Limit results for testing pagination
  });

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta API Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(
    Array.isArray(result.groups),
    "Response should contain a groups array"
  );
  console.log(
    `Successfully listed ${result.groups.length} groups for user ${testUserId}.`
  );
  if (result.groups.length > 0) {
    const firstGroup = result.groups[0];
    assert(firstGroup.id, "First group should have an ID");
    assert(firstGroup.profile.name, "First group should have a name");
    console.log("Sample group:", JSON.stringify(firstGroup, null, 2));
  }

  console.log("Okta listUserGroups test completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testListOktaUserGroups failed:", error.message);
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
