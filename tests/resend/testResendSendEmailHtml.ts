import { runAction } from "../../src/app.js";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "sendEmailHtml",
    "resend",
    {
      apiKey: "insert-during-testing",
      emailFrom: "Example User <example@example.com>",
      emailReplyTo: "insert-during-testing", // "Example User <example@example.com>"
    }, // authParams
    {
      to: "insert-during-testing",
      subject: "Test HTML Email",
      content:
        "<h1>This is a test HTML email</h1><p>This email contains <strong>HTML content</strong>.</p>",
    },
  );
  console.log(result);
  assert(result.success, "HTML email was not sent successfully");
}

runTest().catch(console.error);
