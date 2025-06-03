import assert from "node:assert";
import { runAction } from "../../src/app";
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
  assert(result, "Response should not be null");
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(Array.isArray(result.users), "Response should contain a users array");
  result.users.forEach(
    (user: {
      id: string;
      status?: string;
      created?: string;
      activated?: string | null;
      statusChanged?: string | null;
      lastLogin?: string | null;
      lastUpdated?: string;
      passwordChanged?: string;
      type?: {
        id?: string;
      };
      profile: {
        firstName?: string;
        lastName?: string;
        mobilePhone?: string | null;
        secondEmail?: string | null;
        login?: string;
        email?: string;
      };
      realmId?: string;
    }) => {
      assert(user.id, "User should have an ID");
      assert(
        typeof user.status === "string" || user.status === undefined,
        "User status should be a string or undefined"
      );
      assert(
        typeof user.created === "string" || user.created === undefined,
        "User created should be a string or undefined"
      );
      assert(
        typeof user.activated === "string" ||
          user.activated === null ||
          user.activated === undefined,
        "User activated should be a string, null, or undefined"
      );
      assert(
        typeof user.statusChanged === "string" ||
          user.statusChanged === null ||
          user.statusChanged === undefined,
        "User statusChanged should be a string, null, or undefined"
      );
      assert(
        typeof user.lastLogin === "string" ||
          user.lastLogin === null ||
          user.lastLogin === undefined,
        "User lastLogin should be a string, null, or undefined"
      );
      assert(
        typeof user.lastUpdated === "string" || user.lastUpdated === undefined,
        "User lastUpdated should be a string or undefined"
      );
      assert(
        typeof user.passwordChanged === "string" ||
          user.passwordChanged === undefined,
        "User passwordChanged should be a string or undefined"
      );
      assert(
        user.type === undefined || typeof user.type === "object",
        "User type should be an object or undefined"
      );
      assert(
        user.profile === undefined || typeof user.profile === "object",
        "User profile should be an object or undefined"
      );
    }
  );
  console.log(`Successfully listed ${result.users.length} Okta users.`);

  console.log("Running Okta listUsers test with maxResults set to 2...");
  result = await runAction("listOktaUsers", "okta", authParams, {
    maxResults: 2,
  });
  assert(result, "Response should not be null");
  assert(result.success, `Action should be successful. Error: ${result.error}`);
  assert(Array.isArray(result.users), "Response should contain a users array");
  assert(
    result.users.length <= 2,
    "Users array should not exceed maxResults limit"
  );
  console.log(
    `Successfully listed ${result.users.length} Okta users with maxResults set to 2.`
  );

  if (testUserEmail) {
    console.log(
      `Running Okta listUsers search test for email: ${testUserEmail}`
    );
    const searchResult = await runAction("listOktaUsers", "okta", authParams, {
      searchQuery: `profile.email eq "${testUserEmail}"`,
    });
    assert(searchResult, "Search response should not be null");
    assert(
      searchResult.success,
      `Search action should be successful. Error: ${searchResult.error}`
    );
    assert(
      Array.isArray(searchResult.users),
      "Search response should contain a users array"
    );
    assert(
      searchResult.users.length > 0,
      `No users found for email: ${testUserEmail}. Ensure the test user exists in Okta.`
    );
    console.log(
      `Successfully found ${searchResult.users.length} user(s) for email: ${testUserEmail}`
    );
    const foundUser = searchResult.users[0];
    assert(foundUser.id, "Found user should have an ID");
    console.log(foundUser);
    ``;
    assert(
      foundUser.profile.email === testUserEmail,
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
