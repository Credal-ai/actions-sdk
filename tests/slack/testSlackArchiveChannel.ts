import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result1 = await runAction(
    "archiveChannel",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelName: process.env.SLACK_TEST_CHANNEL_NAME },
  );
  const result2 = await runAction(
    "archiveChannel",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelId: process.env.SLACK_TEST_CHANNEL_ID },
  );
  assert(result1, "Response should not be null");
  assert(result1.success, "Channel archiving should be successful");
  console.log(
    "Archive Channel Test Response 1: " + JSON.stringify(result1, null, 2),
  );
  assert(result2, "Response should not be null");
  assert(result2.success, "Channel archiving should be successful");
  console.log(
    "Archive Channel Test Response 2: " + JSON.stringify(result2, null, 2),
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
