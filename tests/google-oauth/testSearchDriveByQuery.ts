import type { googleOauthSearchDriveByQueryParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";

/**
 * Test for searching Google Drive by keywords
 */
async function runTest() {
  console.log("Running test searchDriveByKeywords");

  const result = await runAction(
    "searchDriveByQuery",
    "googleOauth",
    {
      authToken: "google-oauth-token", // Use a valid OAuth token with Drive readonly scope,
    },
    {
      query: "fullText contains 'Pokemon'", // Replace with your own query
      searchDriveByDrive: false,
      orderByQuery: "modifiedTime asc", // Order by modified time descending (newest first)
    } as googleOauthSearchDriveByQueryParamsType
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
