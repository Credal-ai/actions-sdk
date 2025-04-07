import { runAction } from "../src/app";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "sendEmail",
    "resend",
    {
      apiKey: "insert-during-testing",
      emailFrom: "Example User <example@example.com>",
      emailReplyTo: "insert-during-testing", // "Example User <example@example.com>"
    }, // authParams
    {
      to: "insert-during-testing",
      subject: "Test Email",
      content: "This is a test email",
    },
  );
  console.log(result);
  assert(result.success, "Email was not sent successfully");
}

runTest().catch(console.error);
