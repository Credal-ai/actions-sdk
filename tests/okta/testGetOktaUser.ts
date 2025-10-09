import assert from "node:assert";
import { runAction } from "../../src/app.js";
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

  console.log("Running Okta getUser test...");
  const result = await runAction("getOktaUser", "okta", authParams, {
    userId: testUserId,
  });

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta API Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(result.user, "Response should contain user details");

  // Check if userId matches the test user ID or if the email matches
  const userIdMatches = result.user.id === testUserId;
  const emailMatches = result.user.profile?.email &&
                       (result.user.profile.email === testUserId ||
                        result.user.profile.login === testUserId);

  assert(
    userIdMatches || emailMatches,
    `User ID or email should match the test identifier. Got ID: ${result.user.id}, Email: ${result.user.profile?.email}, Expected: ${testUserId}`
  );
  assert(result.user.profile.email, "User should have an email");
  console.log("Retrieved user:", JSON.stringify(result.user, null, 2));

  console.log("Okta getUser test completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testGetOktaUser failed:", error.message);
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
