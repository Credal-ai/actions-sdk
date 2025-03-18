import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
  console.log("Running test for Looker enableUserByEmail");

  // Run test to find and potentially enable user
  const result = await runAction(
    "enableUserByEmail",
    "looker",
    {
      baseUrl: "https://your-looker-instance.cloud.looker.com",
    },
    {
      userEmail: "user@example.com",
      clientId: "your-client-id", 
      clientSecret: "your-client-secret"
    }
  );

  console.log("Result:", result);
  
  if (result.success) {
    console.log(`User ${result.userDetails?.email} status: ${result.userDetails?.isDisabled ? "disabled" : "enabled"}`);
    assert(!result.userDetails?.isDisabled, "User should be enabled");
  }
}

export default runTest; 