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

  console.log("Running Okta listUserGroups test...");
  const result = await runAction("listOktaUserGroups", "okta", authParams, {
    userId: testUserId,
    maxResults: 50, // Limit results for testing pagination
  });

  assert(result, "Response should not be null");

  if (result.error) {
    console.error("Okta API Error:", result.error);
  }
  assert(!result.error, `Action should be successful. Error: ${result.error}`);
  assert(
    Array.isArray(result.results),
    "Response should contain a results array"
  );
  console.log(
    `Successfully listed ${result.results.length} groups for user ${testUserId}.`
  );
  if (result.results.length > 0) {
    const firstResult = result.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name string");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url string");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have a contents object");
    assert(firstResult.contents.id, "First result contents should have an ID");
    assert(firstResult.contents.profile?.name, "First result contents should have a profile name");
    console.log("Sample group:", JSON.stringify(firstResult, null, 2));
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
