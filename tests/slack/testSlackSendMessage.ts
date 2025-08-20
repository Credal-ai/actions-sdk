import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result1 = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelName: process.env.SLACK_TEST_CHANNEL_NAME, message: "Hello world" },
  );
  const result2 = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelId: process.env.SLACK_TEST_CHANNEL_ID, message: "Hello world" },
  );
  assert(result1, "Response should not be null");
  assert(result1.success, "Message sending should be successful");
  assert(result2, "Response should not be null");
  assert(result2.success, "Message sending should be successful");
  console.log(
    "Send Message Test Response 1: " + JSON.stringify(result1, null, 2),
    "Send Message Test Response 2: " + JSON.stringify(result2, null, 2)
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
