import assert from "node:assert";
import { runAction } from "../../src/app";
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
  assert(result, "Response should not be null");
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(
    Array.isArray(result.groups),
    "Response should contain a groups array"
  );
  console.log(`Successfully listed ${result.groups.length} Okta groups.`);

  console.log("Running Okta listGroups test with maxResults set to 201...");
  result = await runAction("listOktaGroups", "okta", authParams, {
    maxResults: 201,
  });
  assert(result, "Response should not be null");
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(
    Array.isArray(result.groups),
    "Response should contain a groups array"
  );
  assert(
    result.groups.length <= 201,
    "Groups array should not exceed maxResults limit"
  );
  console.log(
    `Successfully listed ${result.groups.length} Okta groups with maxResults set to 201.`
  );

  if (testGroupName) {
    console.log(
      `Running Okta listGroups search test for name: ${testGroupName}`
    );
    const searchResult = await runAction("listOktaGroups", "okta", authParams, {
      searchQuery: `profile.name sw "${testGroupName}"`,
    });
    assert(searchResult, "Search response should not be null");
    assert(
      searchResult.success,
      `Search action should be successful. Error: ${searchResult.error}`
    );
    assert(
      Array.isArray(searchResult.groups),
      "Search response should contain a groups array"
    );
    assert(
      searchResult.groups.length > 0,
      `No groups found for name: ${testGroupName}. Ensure the test group exists in Okta.`
    );
    console.log(
      `Successfully found ${searchResult.groups.length} group(s) for name: ${testGroupName}`
    );
    const foundGroup = searchResult.groups[0];
    assert(foundGroup.id, "Found group should have an ID");
    console.log("Found group Name:", foundGroup.profile.name);
    assert(
      foundGroup.profile.name.startsWith(testGroupName),
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
