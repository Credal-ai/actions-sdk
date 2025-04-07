import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
  // Note: This test requires a valid FIRECRAWL_API_KEY in your environment variables
  if (!process.env.FIRECRAWL_API_KEY) {
    console.warn(
      "Warning: FIRECRAWL_API_KEY not found in environment variables. Test will likely fail.",
    );
  }

  // Test with a real tweet URL from X.com (formerly Twitter)
  const tweetUrl = "https://twitter.com/elonmusk/status/1899583456050598202";

  const result = await runAction(
    "scrapeTweetDataWithNitter",
    "firecrawl",
    {
      apiKey: process.env.FIRECRAWL_API_KEY,
    },
    {
      tweetUrl,
    },
  );

  assert(result, "Response should not be null");
  assert(result.text, "Response should contain tweet text");

  console.log(
    `Successfully scraped tweet content: ${result.text.substring(0, 100)}...`,
  );

  // Test with an X.com URL
  const xUrl = "https://x.com/elonmusk/status/1899583456050598202";

  const xResult = await runAction(
    "scrapeTweetDataWithNitter",
    "firecrawl",
    {
      apiKey: process.env.FIRECRAWL_API_KEY,
    },
    {
      tweetUrl: xUrl,
    },
  );

  assert(xResult, "X.com response should not be null");
  assert(xResult.text, "X.com response should contain tweet text");

  console.log(
    `Successfully scraped X.com tweet content: ${xResult.text.substring(0, 100)}...`,
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
