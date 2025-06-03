import assert from "node:assert";
import dotenv from "dotenv";
import { runAction } from "../../src/app"; // Import runAction

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

  console.log("Listing MFA factors for the user...");
  const listResult = await runAction("listMFA", "okta", authParams, {
    userId: testUserId,
  });

  assert(listResult, "Response should not be null");

  if (!listResult.success) {
    console.error("Failed to list MFA factors:", listResult.error);
    return;
  }

  console.log("Successfully listed MFA factors for user:", listResult.factors);

  console.log("Okta listMFA tests completed successfully.");
}

runTest().catch((error) => {
  if (error instanceof Error) {
    console.error("Okta testListMFA failed:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
  process.exit(1);
});
