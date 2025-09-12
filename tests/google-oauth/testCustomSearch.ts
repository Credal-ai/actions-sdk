import type {
  googleOauthCustomSearchOutputType,
  googleOauthCustomSearchParamsType,
} from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";

// Note: Google Custom Search API uses API key authentication (not OAuth tokens)
// This is different from other Google APIs that require OAuth 2.0 tokens
// Configuration
const apiKey = "insert-api-key"; // generate from https://developers.google.com/custom-search/v1/overview
const customSearchEngineId = "insert-custom-search-engine-id"; // create a new custom search engine https://programmablesearchengine.google.com/controlpanel/create

/**
 * Test for Google Custom Search API using API key authentication
 */
async function runTest() {
  console.log("Running test customSearch");

  const result = (await runAction(
    "customSearch",
    "googleOauth",
    {
      authToken: apiKey, // Use API key instead of OAuth token
    },
    {
      query: "OpenAI GPT", // Search query
      customSearchEngineId, // Custom Search Engine ID from environment
      num: 5, // Number of results to return
    } as googleOauthCustomSearchParamsType
  )) as googleOauthCustomSearchOutputType;

  // Validate the result
  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.items), "Items should be an array");
  assert(result.items.length <= 5, "There should be at most 5 items");

  if (result.items.length > 0) {
    const firstItem = result.items[0];
    assert(firstItem.title, "First item should have a title");
    assert(firstItem.link, "First item should have a link");
    assert(firstItem.snippet, "First item should have a snippet");
    assert(firstItem.displayLink, "First item should have a displayLink");
  }

  // Validate search information if present
  if (result.searchInformation) {
    assert(
      typeof result.searchInformation.searchTime === "number",
      "Search time should be a number"
    );
    assert(
      typeof result.searchInformation.totalResults === "string",
      "Total results should be a string"
    );
  }

  console.log(`Found ${result.items.length} search results`);
  console.log(
    "Search results:",
    result.items.map((item) => ({ title: item.title, link: item.link }))
  );

  if (result.searchInformation) {
    console.log(
      `Search completed in ${result.searchInformation.searchTime} seconds`
    );
    console.log(
      `Total results available: ${result.searchInformation.totalResults}`
    );
  }
}

// Test with minimal parameters
async function runMinimalTest() {
  console.log("Running minimal customSearch test");

  const result = await runAction(
    "customSearch",
    "googleOauth",
    {
      authToken: apiKey,
    },
    {
      query: "test",
      customSearchEngineId,
    } as googleOauthCustomSearchParamsType
  );

  assert.strictEqual(
    result.success,
    true,
    "Minimal search should be successful"
  );
  assert(Array.isArray(result.items), "Items should be an array");

  console.log(`Minimal search found ${result.items.length} results`);
}

// Run all tests
async function runAllTests() {
  try {
    await runTest();
    await runMinimalTest();
    console.log("All customSearch tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: unknown; status?: number };
      };
      console.error("API response:", axiosError.response?.data);
      console.error("Status code:", axiosError.response?.status);
    }
    process.exit(1);
  }
}

runAllTests();
