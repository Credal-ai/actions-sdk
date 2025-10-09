import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

async function runTest() {
  const oktaAuthToken = process.env.OKTA_AUTH_TOKEN;
  const oktaDomain = process.env.OKTA_DOMAIN; // e.g., https://yourdomain.okta.com
  const testUserEmail = process.env.OKTA_TEST_USER_EMAIL;

  if (!oktaAuthToken || !oktaDomain) {
    console.warn(
      "OKTA_AUTH_TOKEN or OKTA_DOMAIN environment variables are not set. Skipping Okta tests."
    );
    // To make this a failing test if credentials are not set, uncomment next line:
    // assert.fail("Missing Okta environment variables for testing. Please set OKTA_AUTH_TOKEN and OKTA_DOMAIN in .env file.");
    return;
  }

  const authParams = { authToken: oktaAuthToken, baseUrl: oktaDomain };

  console.log("Running Okta listUsers test without maxResults...");
  let result = await runAction("listOktaUsers", "okta", authParams, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  // Validate response structure
  assert(result, "Response should not be null");
  assert(!result.error, `Should not have error. Got: ${result.error}`);
  assert(Array.isArray(result.results), "Results should be an array");

  // Validate first result structure if results exist
  if (result.results.length > 0) {
    const firstResult = result.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

    // Validate contents has reasonable fields
    const contents = firstResult.contents;
    assert(
      contents.id || contents.profile || contents.status,
      "Contents should have at least one reasonable field (id, profile, or status)"
    );
  }

  console.log(`Successfully listed ${result.results.length} Okta users.`);

  console.log("Running Okta listUsers test with maxResults set to 2...");
  result = await runAction("listOktaUsers", "okta", authParams, {
    maxResults: 2,
  });
  assert(result, "Response should not be null");
  assert(!result.error, `Should not have error. Got: ${result.error}`);
  assert(Array.isArray(result.results), "Results should be an array");
  assert(
    result.results.length <= 2,
    "Results array should not exceed maxResults limit"
  );
  console.log(
    `Successfully listed ${result.results.length} Okta users with maxResults set to 2.`
  );

  if (testUserEmail) {
    console.log(
      `Running Okta listUsers search test for email: ${testUserEmail}`
    );
    const searchResult = await runAction("listOktaUsers", "okta", authParams, {
      searchQuery: `profile.email eq "${testUserEmail}"`,
    });
    assert(searchResult, "Search response should not be null");
    assert(!searchResult.error, `Should not have error. Got: ${searchResult.error}`);
    assert(Array.isArray(searchResult.results), "Results should be an array");
    assert(
      searchResult.results.length > 0,
      `No users found for email: ${testUserEmail}. Ensure the test user exists in Okta.`
    );
    console.log(
      `Successfully found ${searchResult.results.length} user(s) for email: ${testUserEmail}`
    );
    const foundUser = searchResult.results[0];
    assert(foundUser.name && typeof foundUser.name === "string", "Found user should have a name");
    assert(foundUser.url && typeof foundUser.url === "string", "Found user should have a URL");
    assert(foundUser.contents && typeof foundUser.contents === "object", "Found user should have contents");
    assert(foundUser.contents.id, "Found user contents should have an ID");
    console.log(foundUser);
    assert(
      foundUser.contents.profile.email === testUserEmail,
      "Found user's email should match the test email"
    );
    console.log("Found user:", JSON.stringify(foundUser, null, 2));
  } else {
    console.warn(
      "OKTA_TEST_USER_EMAIL environment variable is not set. Skipping search test."
    );
  }

  console.log("Okta listUsers tests completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testListOktaUsers failed:", error.message);
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
