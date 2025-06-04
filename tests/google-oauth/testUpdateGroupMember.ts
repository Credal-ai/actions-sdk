import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "updateGroupMember",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN },
    {
      groupKey: process.env.GOOGLE_GROUP_KEY || "group-key",
      memberKey: process.env.GOOGLE_GROUP_MEMBER_KEY || "member-key",
      role: "OWNER", // "MANAGER", "MEMBER", "OWNER"
    }
  );

  console.log("Update Group Member Test Result:", result);
  assert(result, "Should return a result");
  assert(result.success, "Should be successful");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
