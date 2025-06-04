import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "createGroup",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN },
    {
      email: `test-group-${Date.now()}@${process.env.GOOGLE_GROUP_DOMAIN || "example.com"}`,
      name: "Test Group",
      description: "Created by automated test", // optional
    }
  );
  console.log("Create Group Test Result:", result);

  assert(result, "Should return a result");
  assert(result.success, "Should have success boolean");
  assert(typeof result.groupId === "string" && result.groupId.length > 0, "Should have valid groupID string");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
