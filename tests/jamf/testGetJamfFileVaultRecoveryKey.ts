import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const subdomain = "insert-during-testing"; // Replace with your actual subdomain
  const username = "insert-during-testing"; // Replace with your actual username
  const password = "insert-during-testing"; // Replace with your actual password
  const computerId = "B037B8F6-4053-5EFE-B646-1054CC5CCFB4"; // Replace with the actual computer ID

  if (!subdomain || !username || !password || !computerId) {
    console.error("Missing required environment variables for test");
    process.exit(1);
  }

  const result = await runAction(
    "getJamfFileVaultRecoveryKey",
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
