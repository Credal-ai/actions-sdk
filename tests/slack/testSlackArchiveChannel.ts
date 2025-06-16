import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "archiveChannel",
    "slack",
    { authToken: process.env.SLACK_BOT_TOKEN },
    { channelId: process.env.SLACK_CHANNEL_ID },
  );
  assert(result, "Response should not be null");
  assert(result.success, "Channel archiving should be successful");
  console.log(
    "Archive Channel Test Response: " + JSON.stringify(result, null, 2),
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
