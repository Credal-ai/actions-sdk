import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const subdomain = "credalainfr"; // Replace with your actual subdomain
  const username = "riaballi"; // Replace with your actual username
  const password = "H7oMrBnxgnAQYXk4wCdW"; // Replace with your actual password
  const computerId = "Mtxgqm4x72"; // Replace with the actual computer ID

  if (!subdomain || !username || !password || !computerId) {
    console.error("Missing required environment variables for test");
    process.exit(1);
  }

  const result = await runAction(
    "getFileVaultRecoveryKey",
    "jamf",
    {
      username,
      password,
      subdomain,
    },
    {
      computerId,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.recoveryKey, "Response should contain the recovery key");

  console.log(`Successfully retrieved FileVault recovery key for device: ${computerId}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});