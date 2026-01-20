import { runAction } from "../../src/app.js";
import { assert } from "node:console";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function runTest() {
  // Validate required environment variables
  const requiredEnvVars = [
    "RESEND_API_KEY",
    "RESEND_EMAIL_FROM",
    "RESEND_EMAIL_REPLY_TO",
    "RESEND_EMAIL_TO",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(
        `Missing required environment variable: ${envVar}. Please check your .env file.`
      );
    }
  }

  // Test 1: Send HTML email to single recipient
  console.log("Test 1: Sending HTML email to single recipient...");
  const result1 = await runAction(
    "sendEmailHtml",
    "resend",
    {
      apiKey: process.env.RESEND_API_KEY!,
      emailFrom: process.env.RESEND_EMAIL_FROM!,
      emailReplyTo: process.env.RESEND_EMAIL_REPLY_TO!,
    }, // authParams
    {
      to: [process.env.RESEND_EMAIL_TO!],
      subject: "Test HTML Email",
      content:
        "<h1>This is a test HTML email</h1><p>This email contains <strong>HTML content</strong>.</p>",
    }
  );
  console.log(result1);
  assert(
    result1.success,
    "HTML email to single recipient was not sent successfully"
  );

  // Test 2: Send HTML email to multiple recipients
  console.log("\nTest 2: Sending HTML email to multiple recipients...");
  const result2 = await runAction(
    "sendEmailHtml",
    "resend",
    {
      apiKey: process.env.RESEND_API_KEY!,
      emailFrom: process.env.RESEND_EMAIL_FROM!,
      emailReplyTo: process.env.RESEND_EMAIL_REPLY_TO!,
    },
    {
      const splitEmail = process.env.RESEND_EMAIL_TO?.split("@");
      to: [
        `${splitEmail?.[0]}+1@${splitEmail?.[1]}`,
        `${splitEmail?.[0]}+2@${splitEmail?.[1]}`,
        `${splitEmail?.[0]}+3@${splitEmail?.[1]}`,
      ],
      subject: "Test HTML Email to Multiple Recipients",
      content:
        "<h1>Test HTML Email</h1><p>This HTML email is sent to <strong>multiple recipients</strong>.</p>",
    }
  );
  console.log(result2);
  assert(
    result2.success,
    "HTML email to multiple recipients was not sent successfully"
  );

  console.log("\n✅ All tests passed!");
}

runTest().catch(console.error);
