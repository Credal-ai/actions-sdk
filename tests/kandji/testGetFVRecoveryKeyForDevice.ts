import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const subdomain = "insert-during-test"; // Replace with your actual subdomain
  const apiKey = "insert-during-test"; // Replace with your actual API key
  const userEmail = "insert-during-test"; // Replace with the user email of the device owner

  if (!subdomain || !apiKey || !userEmail) {
    console.error("Missing required environment variables for test");
    process.exit(1);
  }

  const result = await runAction(
    "getFVRecoveryKeyForDevice",
    "kandji",
    {
      apiKey,
    },
    {
      userEmail,
      subdomain,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.recoveryKey, "Response should contain the recovery key");

  console.log(`Successfully retrieved FileVault recovery key for device: ${userEmail}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});