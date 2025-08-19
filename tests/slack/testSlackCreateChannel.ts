import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const channelName = "test-channel-" + Math.floor(Math.random() * 10000);
  console.log("Creating channel: " + channelName);
  const result = await runAction(
    "createChannel",
    "slack",
    { authToken: process.env.SLACK_AUTH_TOKEN },
    {
      channelName,
      isPrivate: false,
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Channel creation should be successful");
  assert(result.channelId, "Response should contain channelId");
  assert(result.channelUrl, "Response should contain channelUrl");
  console.log(
    "Create channel test response: " + JSON.stringify(result, null, 2),
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
