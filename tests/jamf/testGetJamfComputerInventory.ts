import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const subdomain = "insert-during-testing"; // Replace with your actual subdomain
  const username = "insert-during-testing"; // Replace with your actual username
  const password = "insert-during-testing"; // Replace with your actual password

  if (!subdomain || !username || !password) {
    console.error("Missing required environment variables for test");
    process.exit(1);
  }

  const result = await runAction(
    "getJamfComputerInventory",
    "jamf",
    {
      username,
      password,
      subdomain,
    },
    {
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");

  console.log(`Successfully retrieved computer inventory`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
