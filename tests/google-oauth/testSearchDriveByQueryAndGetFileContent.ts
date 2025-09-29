import type { googleOauthSearchDriveByQueryAndGetFileContentParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

/**
 * Test for searching Google Drive by keywords
 */
async function runTest() {
  console.log("Running test searchDriveByKeywords");

  const result = await runAction(
    "searchDriveByQueryAndGetFileContent",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_OAUTH_TOKEN, // Use a valid OAuth token with Drive readonly scope,
    },
    {
      query: "fullText contains 'credal'", // Replace with your own query
      searchDriveByDrive: false,
      orderByQuery: "modifiedTime asc", // Order by modified time descending (newest first)
      limit: 5,
      fileSizeLimit: 300,
    } as googleOauthSearchDriveByQueryAndGetFileContentParamsType,
  );

  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.files), "Files should be an array");
  assert(result.files.length <= 5, "There should be at most 5 files");
  if (result.files.length > 0) {
    const firstFile = result.files[0];
    assert(firstFile.id, "First file should have an id");
    assert(firstFile.name, "First file should have a name");
    assert(firstFile.mimeType, "First file should have a mimeType");
    assert(firstFile.url, "First file should have a url");
    assert(firstFile.content, "First file has content in it");
  }

  console.log("Found files:", result.files);
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
