import type { googleOauthSearchDriveByKeywordsParamsType } from "../../src/actions/autogen/types.js";
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
    "searchDriveByKeywords",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_OAUTH_TOKEN,
    },
    {
      keywords: ["replace-me", "with-keywords", "to-search-for"],
    } as googleOauthSearchDriveByKeywordsParamsType
  );
  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.results), "Results should be an array");
  if (result.results.length > 0) {
    const firstFile = result.results[0];
    assert(firstFile.name, "First file should have a name");
    assert(firstFile.url, "First file should have a url");
    assert(firstFile.contents, "First file should have contents");
  }

  console.log("Found files:", result.results);
}

/**
 * Test for searching Google Drive by keywords
 * Make sure there is a trashed file in your Google Drive with the text "replace-me-trash"
 */
async function runTestIncludeTrashed() {
  console.log("Running test searchDriveByKeywords with trashed files");

  const result = await runAction(
    "searchDriveByKeywords",
    "googleOauth",
    {
      authToken: process.env.GOOGLE_AUTH_TOKEN,
    },
    {
      keywords: ["replace-me-trash"],
      includeTrashed: true,
    } as googleOauthSearchDriveByKeywordsParamsType
  );
  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.results), "Results should be an array");
  if (result.results.length > 0) {
    const firstFile = result.results[0];
    assert(firstFile.name, "First file should have a name");
    assert(firstFile.url, "First file should have a url");
    assert(firstFile.contents, "First file should have contents");
  }

  console.log("Found files:", result.results);
}

// Run both tests
async function runAllTests() {
  try {
    await runTest();
    console.log("✅ Regular search test passed");

    await runTestIncludeTrashed();
    console.log("✅ Trashed files search test passed");

    console.log("🎉 All tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
