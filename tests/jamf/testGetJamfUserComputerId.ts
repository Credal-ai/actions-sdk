import assert from "node:assert";
import { runAction } from "../../src/app.js";

async function runTest() {
  const subdomain = "insert-during-test"; // Replace with your actual subdomain
  const authToken = "insert-during-test"; // Replace with your actual password
  if (!subdomain || !authToken) {
    console.error("Missing required environment variables for test");
    process.exit(1);
  }

  const result = await runAction(
    "getJamfUserComputerId",
    "jamf",
    {
      authToken,
      subdomain,
    },
    {
      userEmail: "insert-during-test", // Replace with a valid user email for testing
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");

  console.log(`Successfully retrieved user computer ID`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
