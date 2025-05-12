import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const subdomain = "insert-during-test"; // Replace with your actual subdomain
  const apiKey = "insert-during-test"; // Replace with your actual API key
  const serialNumber = "insert-during-test"; // Replace with the serial number of the device you want to test

  if (!subdomain || !apiKey || !serialNumber) {
    console.error("Missing required environment variables for test");
    process.exit(1);
  }

  const result = await runAction(
    "getFVRecoveryKeyForDevice",
    "kandji",
    {
      subdomain,
      apiKey,
    },
    {
      serialNumber,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.recoveryKey, "Response should contain the recovery key");

  console.log(`Successfully retrieved FileVault recovery key for device: ${serialNumber}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});