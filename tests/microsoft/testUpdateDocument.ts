import { runAction } from "../../src/app";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  // Step 1: Create a new document
  const createResult = await runAction(
    "createDocument",
    "microsoft",
    {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    },
    {
      siteId: process.env.MICROSOFT_SITE_ID!,
      folderId: process.env.MICROSOFT_FOLDER_ID!,
      name: `TestDocument-${Date.now()}.txt`,
      content: "This is the initial content of the document.",
    }
  );

  console.log("Create Result:", createResult);
  assert(createResult.success, "Document was not created successfully");

  const documentId = createResult.documentId;
  console.log("Created Document ID:", documentId);

  // Step 2: Update the document
  const updatedContent = `This is the updated content of the document. ${new Date().toISOString()}`;
  const updateResult = await runAction(
    "updateDocument",
    "microsoft",
    {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    },
    {
      siteId: process.env.MICROSOFT_SITE_ID!,
      documentId,
      content: updatedContent,
    }
  );

  console.log("Update Result:", updateResult);
  assert(updateResult.success, "Document was not updated successfully");

  // Step 3: Fetch the document to verify the updated content
  const fetchResult = await runAction(
    "getDocument",
    "microsoft",
    {
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      refreshToken: process.env.MICROSOFT_REFRESH_TOKEN!,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    },
    {
      siteId: process.env.MICROSOFT_SITE_ID!,
      documentId,
    }
  );

  console.log("Fetch Result:", fetchResult);
  assert(fetchResult.success, "Document was not fetched successfully");
  assert(
    fetchResult.content === updatedContent,
    "Document content was not updated correctly"
  );

  console.log("Document content verified successfully.");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
