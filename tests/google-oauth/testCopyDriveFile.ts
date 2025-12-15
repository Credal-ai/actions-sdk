import type {
  googleOauthCopyDriveFileParamsType,
} from "../../src/actions/autogen/types.js";
import copyDriveFile from "../../src/actions/providers/google-oauth/copyDriveFile.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

/**
 * Test for copying a Google Drive file
 * Useful for copying template files (e.g., slide decks) to create new documents
 */
async function runTest() {
  const googleDriveFileId = process.env.GOOGLE_TEST_FILE_ID;
  const googleDriveOauthToken = process.env.GOOGLE_OAUTH_TOKEN;
  console.log("Running test copyDriveFile");

  if (!googleDriveOauthToken) {
    console.log("⚠️  Skipping test - GOOGLE_OAUTH_TOKEN not found");
    console.log("To run this test, set GOOGLE_OAUTH_TOKEN environment variable");
    return;
  }

  if (!googleDriveFileId) {
    console.log("⚠️  Skipping test - GOOGLE_DRIVE_FILE_ID not found");
    console.log("To run this test, set GOOGLE_DRIVE_FILE_ID environment variable (template file ID)");
    return;
  }

  const params: googleOauthCopyDriveFileParamsType = {
    fileId: googleDriveFileId,
    name: `Test Copy - ${new Date().toISOString()}`,
    // Optional: parentFolderId can be set to place the copy in a specific folder
    parentFolderId: process.env.GOOGLE_TEST_PARENT_FOLDER_ID,
  };

  const startTime = performance.now();
  const result = await copyDriveFile({
    params,
    authParams: { authToken: googleDriveOauthToken },
  });
  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`Time taken: ${duration} milliseconds`);

  console.log("Result is:", result);

  // Basic assertions
  assert.strictEqual(result.success, true, "Copy operation should be successful");
  assert(result.fileId, "Should return the new file ID");
  assert(result.fileUrl, "Should return the file URL");
  assert(result.fileName, "Should return the file name");
  assert(result.mimeType, "Should return the MIME type");

  console.log("✅ Copy successful!");
  console.log("New file ID:", result.fileId);
  console.log("New file URL:", result.fileUrl);
  console.log("File name:", result.fileName);
  console.log("MIME type:", result.mimeType);
}

// Run the test
runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
