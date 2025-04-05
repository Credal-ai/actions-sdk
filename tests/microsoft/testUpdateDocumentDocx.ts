import { runAction } from "../../src/app";
import assert from "node:assert";
import dotenv from "dotenv";
import { Document, Packer, Paragraph, TextRun } from "docx";

dotenv.config();

/**
 * Generates a `.docx` file content as a Buffer.
 * @param text The text to include in the document.
 * @returns A Buffer containing the `.docx` file content.
 */
async function generateDocxContent(text: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
              }),
              new TextRun({
                text: "\nThis is an example of a .docx file generated programmatically.",
                break: 1,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

async function runTest() {
  // Step 1: Generate `.docx` content
  const initialContent = await generateDocxContent("Hello, World!");

  // Step 2: Create a new `.docx` document
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
      name: `TestDocument-${Date.now()}.docx`,
      content: initialContent, // Pass the generated `.docx` content
    }
  );

  console.log("Create Result:", createResult);
  assert(createResult.success, "Document was not created successfully");

  const documentId = createResult.documentId;
  console.log("Created Document ID:", documentId);

  // Step 3: Generate updated `.docx` content
  const updatedContent = await generateDocxContent("Updated Content!");

  // Step 4: Update the `.docx` document
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
      content: updatedContent, // Pass the updated `.docx` content
    }
  );

  console.log("Update Result:", updateResult);
  assert(updateResult.success, "Document was not updated successfully");

  // Step 5: Fetch the document to verify the updated content
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

  // Note: Verifying binary content is complex; you can save the fetched content locally for manual inspection
  console.log("Document content fetched successfully.");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
