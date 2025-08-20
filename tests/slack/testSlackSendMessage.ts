import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result1 = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelName: process.env.SLACK_TEST_PUBLIC_CHANNEL_NAME, message: "Hello world" },
  );
  const result2 = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelId: process.env.SLACK_TEST_PUBLIC_CHANNEL_ID, message: "Hello world" },
  );
  const result3 = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelName: process.env.SLACK_TEST_PRIVATE_CHANNEL_NAME, message: "Hello world" },
  );
  const result4 = await runAction(
    "sendMessage",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    { channelId: process.env.SLACK_TEST_PRIVATE_CHANNEL_ID, message: "Hello world" },
  );
  
  assert(result1, "Public channel name response should not be null");
  assert(result1.success, "Public channel name message sending should be successful");
  assert(result2, "Public channel ID response should not be null");
  assert(result2.success, "Public channel ID message sending should be successful");
  assert(result3, "Private channel name response should not be null");
  assert(result3.success, "Private channel name message sending should be successful");
  assert(result4, "Private channel ID response should not be null");
  assert(result4.success, "Private channel ID message sending should be successful");
  
  console.log(
    "Send Message Test Response 1 (public name): " + JSON.stringify(result1, null, 2),
    "Send Message Test Response 2 (public ID): " + JSON.stringify(result2, null, 2),
    "Send Message Test Response 3 (private name): " + JSON.stringify(result3, null, 2),
    "Send Message Test Response 4 (private ID): " + JSON.stringify(result4, null, 2)
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
