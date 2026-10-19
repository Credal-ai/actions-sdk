import { runAction } from "../../src/app.js";
import { assert } from "node:console";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "sendOutlookEmail",
    "microsoft",
    {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    }, // authParams
    {
      toRecipients: [process.env.TEST_EMAIL_RECIPIENT!],
      subject: "Test Email from Actions SDK",
      body: "<h1>Hello from Actions SDK</h1><p>This is a test email sent from the Microsoft Outlook email integration.</p>",
      ccRecipients: [], // Optional CC recipients
      bccRecipients: [], // Optional BCC recipients
    },
  );
  console.log(result);
  assert(result.success, "Email was not sent successfully");
}

runTest().catch(console.error);
