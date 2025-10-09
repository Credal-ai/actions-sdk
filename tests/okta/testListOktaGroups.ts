import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

async function runTest() {
  const oktaAuthToken = process.env.OKTA_AUTH_TOKEN;
  const oktaDomain = process.env.OKTA_DOMAIN; // e.g., https://yourdomain.okta.com
  const testGroupName = process.env.OKTA_TEST_GROUP_NAME;

  if (!oktaAuthToken || !oktaDomain) {
    console.warn(
      "OKTA_AUTH_TOKEN or OKTA_DOMAIN environment variables are not set. Skipping Okta tests."
    );
    return;
  }

  const authParams = { authToken: oktaAuthToken, baseUrl: oktaDomain };

  console.log("Running Okta listGroups test without maxResults...");
  let result = await runAction("listOktaGroups", "okta", authParams, {});

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
      contents.id || contents.profile,
      "Contents should have at least one reasonable field (id or profile)"
    );
  }

  console.log(`Successfully listed ${result.results.length} Okta groups.`);

  console.log("Running Okta listGroups test with maxResults set to 201...");
  result = await runAction("listOktaGroups", "okta", authParams, {
    maxResults: 201,
  });
  assert(result, "Response should not be null");
  assert(!result.error, `Should not have error. Got: ${result.error}`);
  assert(Array.isArray(result.results), "Results should be an array");
  assert(
    result.results.length <= 201,
    "Results array should not exceed maxResults limit"
  );
  console.log(
    `Successfully listed ${result.results.length} Okta groups with maxResults set to 201.`
  );

  if (testGroupName) {
    console.log(
      `Running Okta listGroups search test for name: ${testGroupName}`
    );
    const searchResult = await runAction("listOktaGroups", "okta", authParams, {
      searchQuery: `profile.name sw "${testGroupName}"`,
    });
    assert(searchResult, "Search response should not be null");
    assert(!searchResult.error, `Should not have error. Got: ${searchResult.error}`);
    assert(Array.isArray(searchResult.results), "Results should be an array");
    assert(
      searchResult.results.length > 0,
      `No groups found for name: ${testGroupName}. Ensure the test group exists in Okta.`
    );
    console.log(
      `Successfully found ${searchResult.results.length} group(s) for name: ${testGroupName}`
    );
    const foundGroup = searchResult.results[0];
    assert(foundGroup.name && typeof foundGroup.name === "string", "Found group should have a name");
    assert(foundGroup.url && typeof foundGroup.url === "string", "Found group should have a URL");
    assert(foundGroup.contents && typeof foundGroup.contents === "object", "Found group should have contents");
    assert(foundGroup.contents.id, "Found group contents should have an ID");
    console.log("Found group Name:", foundGroup.contents.profile.name);
    assert(
      foundGroup.contents.profile.name.toLowerCase().startsWith(testGroupName.toLowerCase()),
      "Found group's name should match the test name"
    );
    console.log("Found group:", JSON.stringify(foundGroup, null, 2));
  } else {
    console.warn(
      "OKTA_TEST_GROUP_NAME environment variable is not set. Skipping search test."
    );
  }

  console.log("Okta listGroups tests completed successfully.");
}

runTest().catch((error) => {
  console.error("Okta testListOktaGroups failed:", error.message);
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
