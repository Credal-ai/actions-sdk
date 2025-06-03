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

  console.log("Running Okta resetPassword test with sendEmail: true...");
  let result = await runAction("resetPassword", "okta", authParams, {
    userId: testUserId,
    sendEmail: true,
  });

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta API Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  console.log(
    `Successfully reset password for user ${testUserId} with sendEmail: true.`
  );

  if (result.resetPasswordUrl) {
    console.log(`Reset Password URL: ${result.resetPasswordUrl}`);
  }

  console.log("Running Okta resetPassword test with sendEmail: false...");
  result = await runAction("resetPassword", "okta", authParams, {
    userId: testUserId,
    sendEmail: false,
  });

  assert(result, "Response should not be null");

  if (!result.success) {
    console.error("Okta API Error:", result.error);
  }
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  console.log(
    `Successfully reset password for user ${testUserId} with sendEmail: false.`
  );

  if (result.resetPasswordUrl) {
    console.log(`Reset Password URL: ${result.resetPasswordUrl}`);
  } else {
    console.warn(
      "Reset Password URL was not provided when sendEmail was set to false."
    );
  }

  console.log("Okta resetPassword tests completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testResetPassword failed:", error.message);
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
