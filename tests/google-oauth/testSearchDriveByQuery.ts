import type { googleOauthSearchDriveByQueryParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

/**
 * Test for searching Google Drive by keywords (non-trashed files)
 */
async function runTest() {
  console.log("Running test searchDriveByQuery (non-trashed files)");

  const result = await runAction(
    "searchDriveByQuery",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_OAUTH_TOKEN,
    },
    {
      query: "fullText contains 'Pokemon'",
      searchDriveByDrive: false,
      orderByQuery: "modifiedTime desc",
      limit: 5,
    } as googleOauthSearchDriveByQueryParamsType
  );

  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.results), "Results should be an array");
  assert(result.results.length <= 5, "There should be at most 5 files");
  if (result.results.length > 0) {
    const firstFile = result.results[0];
    assert(firstFile.name, "First file should have a name");
    assert(firstFile.url, "First file should have a url");
    assert(firstFile.contents, "First file should have contents");
  }

  console.log("Found files:", result.results);
}

/**
 * Test for searching Google Drive including trashed files
 * Make sure to create a trashed file in your Google Drive and add the text "Trashed File" to it
 */
async function runTrashedTest() {
  console.log("Running test searchDriveByQuery with trashed files");

  const result = await runAction(
    "searchDriveByQuery",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_OAUTH_TOKEN,
    },
    {
      query: "fullText contains 'Trashed File'",
      searchDriveByDrive: false,
      limit: 5,
      includeTrashed: true, // Include trashed files in the search
    } as googleOauthSearchDriveByQueryParamsType
  );

  // Validate the result
  assert.strictEqual(
    result.success,
    true,
    "Trashed files search should be successful"
  );
  assert(Array.isArray(result.results), "Results should be an array");
  assert(result.results.length <= 5, "There should be at most 5 files");

  console.log("Found files:", result.results);
  console.log(`Total files found: ${result.results.length}`);
}

// Run both tests
async function runAllTests() {
  try {
    await runTest();
    console.log("✅ Regular search test passed");

    await runTrashedTest();
    console.log("✅ Trashed files search test passed");

    console.log("🎉 All tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
