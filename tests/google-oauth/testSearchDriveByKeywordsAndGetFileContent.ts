import type { googleOauthSearchDriveByKeywordsAndGetFileContentParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config();

/**
 * Test for searching Google Drive by keywords and getting file content
 */
async function runTest() {
  console.log("Running test searchDriveByKeywordsAndGetFileContent");

  const result = await runAction(
    "searchDriveByKeywordsAndGetFileContent",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_ACTIONS_ACCESS_TOKEN!,
    },
    {
      searchQuery: "Neon pigeons",
      searchDriveByDrive: false,
    } as googleOauthSearchDriveByKeywordsAndGetFileContentParamsType
  );

  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.files), "Files should be an array");

  if (result.files.length > 0) {
    const firstFile = result.files[0];
    assert(firstFile.id, "First file should have an id");
    assert(firstFile.name, "First file should have a name");
    assert(firstFile.mimeType, "First file should have a mimeType");
    assert(firstFile.url, "First file should have a url");
    assert(firstFile.content, "First file should have content");
  }

  console.log("Found files with content:", result.files);
}

// Run the test
runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
