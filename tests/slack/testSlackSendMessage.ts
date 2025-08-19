import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelName: process.env.SLACK_TEST_CHANNEL_NAME, message: "Hello world" },
  );
  assert(result, "Response should not be null");
  assert(result.success, "Message sending should be successful");
  console.log(
    "Send Message Test Response: " + JSON.stringify(result, null, 2),
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
