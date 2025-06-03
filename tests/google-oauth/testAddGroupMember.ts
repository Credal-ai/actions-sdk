import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTests() {
  const result = await runAction(
    "addGroupMember",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN! },
    {
      groupKey: process.env.GOOGLE_GROUP_KEY!,
      email: process.env.GOOGLE_GROUP_MEMBER_EMAIL!, 
      role: "MEMBER", // Set role as needed, e.g., "MEMBER" or "OWNER"
    }
  );
  assert(result, "Should return a result");
  assert(result.success, "Should have success boolean");
  assert(typeof result.memberID === "string", "Should have memberID string");
  console.log("Add Group Members Test Result:", result);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
