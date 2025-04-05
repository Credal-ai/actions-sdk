import { runAction } from "../../src/app";
import { assert } from "node:console";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "createDocument",
    "microsoft",
    {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    }, // authParams
    {
      siteId: process.env.MICROSOFT_SITE_ID!,
      name: `TestDocument-${new Date()}.docx`,
      content: "",
      folderId: process.env.MICROSOFT_FOLDER_ID!,
    }
  );
  console.log(result);
  assert(result.success, "Document was not created successfully");
}

runTest().catch(console.error);
