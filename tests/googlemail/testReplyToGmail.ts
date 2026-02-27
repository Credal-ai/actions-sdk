import type { googlemailReplyToGmailParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Running test replyToGmail");

  const params: googlemailReplyToGmailParamsType = {
    threadId: "19c9ecd73285c616",
    content:
      "<html><body><p>This is a <strong>test reply</strong> sent through the Gmail API. Please ignore this message.</p></body></html>",
  };

  const result = await runAction(
    "replyToGmail",
    "googlemail",
    { authToken: process.env.GOOGLE_OAUTH_SEND_EMAIL_SCOPE },
    params,
  );

  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert.strictEqual(result.success, true, "Reply should be successful");
  assert(typeof result.messageId === "string", "Should return a message ID");
  assert(
    result.messageId && result.messageId.length > 0,
    "Message ID should not be empty",
  );
  assert(typeof result.threadId === "string", "Should return the thread ID");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
