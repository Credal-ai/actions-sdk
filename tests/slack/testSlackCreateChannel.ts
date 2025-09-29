import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const publicChannelName = `test-channel-123456`;
  const privateChannelName = `test-private-channel-123456`;

  console.log("Creating public channel: " + publicChannelName);
  const result1 = await runAction(
    "createChannel",
    "slack",
    {
      authToken: process.env.SLACK_AUTH_TOKEN,
      userEmail: process.env.SLACK_USER_EMAIL,
    },
    {
      channelName: publicChannelName,
      isPrivate: false,
    },
  );

  console.log("Creating private channel: " + privateChannelName);
  const result2 = await runAction(
    "createChannel",
    "slack",
    {
      authToken: process.env.SLACK_AUTH_TOKEN,
      userEmail: process.env.SLACK_USER_EMAIL,
    },
    {
      channelName: privateChannelName,
      isPrivate: true,
    },
  );

  assert(result1, "Public channel response should not be null");
  assert(
    result1.success,
    "Public channel creation should be successful " + result1.error,
  );
  assert(result1.channelId, "Public channel response should contain channelId");
  assert(
    result1.channelUrl,
    "Public channel response should contain channelUrl",
  );

  assert(result2, "Private channel response should not be null");
  assert(
    result2.success,
    "Private channel creation should be successful " + result2.error,
  );
  assert(
    result2.channelId,
    "Private channel response should contain channelId",
  );
  assert(
    result2.channelUrl,
    "Private channel response should contain channelUrl",
  );

  console.log(
    "Create public channel test response: " + JSON.stringify(result1, null, 2),
  );
  console.log(
    "Create private channel test response: " + JSON.stringify(result2, null, 2),
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
