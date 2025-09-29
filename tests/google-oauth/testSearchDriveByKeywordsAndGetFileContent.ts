import type {
  googleOauthSearchDriveByKeywordsAndGetFileContentOutputType,
  googleOauthSearchDriveByKeywordsAndGetFileContentParamsType,
} from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config();

/**
 * Test for searching Google Drive by keywords and getting file content
 */
async function runTest() {
  console.log("Running test searchDriveByKeywordsAndGetFileContent");

  const result = (await runAction(
    "searchDriveByKeywordsAndGetFileContent",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_ACTIONS_ACCESS_TOKEN!,
    },
    {
      searchQuery: "Japan travel expense",
      searchDriveByDrive: false,
    } as googleOauthSearchDriveByKeywordsAndGetFileContentParamsType,
  )) as googleOauthSearchDriveByKeywordsAndGetFileContentOutputType;

  console.log("Found files with content:", result.results);

  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.results), "Files should be an array");

  if (result.results.length > 0) {
    const firstFile = result.results[0];
    assert(firstFile.name, "First file should have a name");
    assert(firstFile.url, "First file should have a url");
    assert(firstFile.contents.id, "First file should have an id");
    assert(firstFile.contents.mimeType, "First file should have a mimeType");
    assert(firstFile.contents.content, "First file should have content");
  }
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
