import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTests() {
  const result = await runAction(
    "deleteGroupMember",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN! },
    {
      groupKey: process.env.GOOGLE_GROUP_KEY!,
      memberKey: process.env.GOOGLE_GROUP_MEMBER_KEY!, 
    }
  );
  assert(result, "Should return a result");
  assert(result.success, "Should be successful");
  console.log("Delete Group Members Test Result:", result);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
