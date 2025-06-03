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

  console.log("Running Okta listGroupMembers test...");
  const result = await runAction("listOktaGroupMembers", "okta", authParams, {
    groupId: testGroupId,
    maxResults: 50, // Limit results for testing pagination
  });

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta API Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(
    Array.isArray(result.members),
    "Response should contain a members array"
  );
  console.log(
    `Successfully listed ${result.members.length} members for group ${testGroupId}.`
  );
  if (result.members.length > 0) {
    const firstMember = result.members[0];
    assert(firstMember.id, "First member should have an ID");
    assert(firstMember.status, "First member should have a status");
    assert(firstMember.created, "First member should have a created timestamp");
    assert(
      firstMember.profile.firstName,
      "First member should have a first name"
    );
    assert(
      firstMember.profile.lastName,
      "First member should have a last name"
    );
    assert(firstMember.profile.email, "First member should have an email");
    console.log("Sample member:", JSON.stringify(firstMember, null, 2));
  }

  console.log("Okta listGroupMembers test completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testListOktaGroupMembers failed:", error.message);
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
