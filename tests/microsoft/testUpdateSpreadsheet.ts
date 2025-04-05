import { runAction } from "../../src/app";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  // Step 1: Create a new spreadsheet
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
      name: `TestSpreadsheet-${Date.now()}.xlsx`,
      content: "",
    }
  );

  console.log("Create Result:", createResult);
  assert(createResult.success, "Spreadsheet was not created successfully");

  const spreadsheetId = createResult.documentId;
  console.log("Created Spreadsheet ID:", spreadsheetId);

  // Step 2: Update the spreadsheet
  const updateResult = await runAction(
    "updateSpreadsheet",
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
      spreadsheetId,
      range: "Sheet1!A1:B3",
      values: [
        ["Name", "Age"],
        ["John Doe", "30"],
        ["Date", new Date().toISOString()],
      ],
    }
  );

  console.log("Update Result:", updateResult);
  assert(updateResult.success, "Spreadsheet was not updated successfully");

  console.log("Spreadsheet updated successfully.");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
