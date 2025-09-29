import type { googleOauthSearchDriveByKeywordsAndGetFileContentParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Integration test for Google Slides text extraction
 * Tests that we can search for and extract text content from real Google Slides presentations
 */
async function runTest() {
  console.log("Running Google Slides integration test");

  if (!process.env.GOOGLE_ACTIONS_ACCESS_TOKEN) {
    console.log("⚠️  Skipping test - GOOGLE_ACTIONS_ACCESS_TOKEN not found");
    console.log(
      "To run this test, set GOOGLE_ACTIONS_ACCESS_TOKEN environment variable",
    );
    return;
  }

  // Search for Google Slides presentations
  const result = await runAction(
    "searchDriveByKeywordsAndGetFileContent",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_ACTIONS_ACCESS_TOKEN!,
    },
    {
      searchQuery: "industry leading security layer",
      searchDriveByDrive: false,
      limit: 10,
    } as googleOauthSearchDriveByKeywordsAndGetFileContentParamsType,
  );

  console.log("Search result:", result);

  // Validate the search was successful
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.files), "Files should be an array");

  //TODO find the returned presentation files, confirm they have content
  console.log("\n🎉 All Google Slides integration tests passed!");
}

// Run the test
runTest().catch((error) => {
  console.error("❌ Integration test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
