import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const testEmail = "placeholder@test.com";

  const result = await runAction(
    "sendDirectMessage",
    "slackUser",
    { authToken: process.env.SLACK_USER_AUTH_TOKEN },
    { userEmail: testEmail, message: "Hello from the actions-sdk test!" },
  );

  assert(result, "Response should not be null");
  assert(result.channelId, "Channel ID should be returned");
  assert(result.messageId, "Message ID should be returned");

  console.log("Send Direct Message Test Response: " + JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

