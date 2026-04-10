import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import {
  firecrawlScrapeUrlOutputSchema,
  type firecrawlScrapeUrlOutputType,
} from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }

  try {
    // Test basic scraping with markdown format
    const result = (await runAction(
      "scrapeUrl",
      "firecrawl",
      { apiKey },
      {
        url: "https://example.com",
        formats: ["markdown"],
        onlyMainContent: true,
        waitMs: 1000,
      },
    )) as firecrawlScrapeUrlOutputType;

    console.dir(result, { depth: 4 });

    // Validate the response structure
    assert.strictEqual(result.success, true);
    assert.equal(
      firecrawlScrapeUrlOutputSchema.safeParse(result).success,
      true,
    );

    // Validate results array
    assert(
      result.results && Array.isArray(result.results),
      "Results should be an array",
    );
    assert(result.results.length > 0, "Should have at least one result");

    // Validate first result
    const firstResult = result.results[0];
    assert(
      typeof firstResult.name === "string",
      "Result name should be a string",
    );
    assert(
      typeof firstResult.url === "string",
      "Result url should be a string",
    );
    assert(
      typeof firstResult.contents === "string",
      "Result contents should be a string",
    );
    assert(firstResult.contents.length > 0, "Content should not be empty");

    console.log("✅ Basic scraping test passed");
  } catch (error) {
    console.error("❌ Basic scraping test failed:", error);
    throw error;
  }
}

async function testMultipleFormats() {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }

  try {
    // Test scraping with multiple formats
    const result = (await runAction(
      "scrapeUrl",
      "firecrawl",
      { apiKey },
      {
        url: "https://example.com",
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
      },
    )) as firecrawlScrapeUrlOutputType;

    console.dir(result, { depth: 4 });

    assert.strictEqual(result.success, true);
    assert(result.results && result.results.length > 0, "Should have results");
    assert(
      result.results[0].contents.includes("=== MARKDOWN ==="),
      "Should contain markdown section",
    );
    assert(
      result.results[0].contents.includes("=== HTML ==="),
      "Should contain HTML section",
    );
    assert(
      result.results[0].contents.includes("=== LINKS ==="),
      "Should contain links section",
    );

    console.log("✅ Multiple formats test passed");
  } catch (error) {
    console.error("❌ Multiple formats test failed:", error);
    throw error;
  }
}

async function testDefaultFormat() {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }

  try {
    // Test scraping without specifying formats (should default to markdown)
    const result = (await runAction(
      "scrapeUrl",
      "firecrawl",
      { apiKey },
      {
        url: "https://example.com",
      },
    )) as firecrawlScrapeUrlOutputType;

    console.dir(result, { depth: 4 });

    assert.strictEqual(result.success, true);
    assert(result.results && result.results.length > 0, "Should have results");
    assert(
      result.results[0].contents.length > 0,
      "Should have content even without format specified",
    );

    console.log("✅ Default format test passed");
  } catch (error) {
    console.error("❌ Default format test failed:", error);
    throw error;
  }
}

async function runAllTests() {
  try {
    await runTest();
    await testMultipleFormats();
    await testDefaultFormat();
    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runAllTests();
