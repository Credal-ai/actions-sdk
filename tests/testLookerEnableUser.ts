import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
  console.log("Running test for Looker enableUserByEmail");

  // Get authentication details from environment variables
  const baseUrl = process.env.LOOKER_BASE_URL;
  const clientId = process.env.LOOKER_CLIENT_ID;
  const clientSecret = process.env.LOOKER_CLIENT_SECRET;
  const userEmail = process.env.LOOKER_TEST_USER_EMAIL;

  if (!baseUrl || !clientId || !clientSecret || !userEmail) {
    console.error("Missing required environment variables for Looker test:");
    console.error(
      "Required: LOOKER_BASE_URL, LOOKER_CLIENT_ID, LOOKER_CLIENT_SECRET, LOOKER_TEST_USER_EMAIL",
    );
    process.exit(1);
  }

  // Run test to find and potentially enable user
  const result = await runAction(
    "enableUserByEmail",
    "looker",
    {
      baseUrl,
      clientId,
      clientSecret,
    },
    {
      userEmail,
    },
  );

  console.log("Result:", result);

  if (result.success) {
    console.log(
      `User ${result.userDetails?.email} status: ${result.userDetails?.isDisabled ? "disabled" : "enabled"}`,
    );
    assert(!result.userDetails?.isDisabled, "User should be enabled");
  }
}

runTest().catch(console.error);
