import type { googlemailSendGmailParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Running test sendGmail");

  const params: googlemailSendGmailParamsType = {
    to: ["recipient@example.com"],
    cc: ["cc@example.com"], // optional field
    bcc: ["bcc@example.com"], // optional field
    subject: "Test Email from Gmail API",
    content: "This is a test email sent through the Gmail API. Please ignore this message.",
  };

  const result = await runAction(
    "sendGmail",
    "googlemail",
    { authToken: process.env.GOOGLE_OAUTH_SEND_EMAIL_SCOPE },  // https://www.googleapis.com/auth/gmail.send
    params,
  );

  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert.strictEqual(result.success, true, "Email send should be successful");
  assert(typeof result.messageId === "string", "Should return a message ID");
  assert(result.messageId && result.messageId.length > 0, "Message ID should not be empty");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});