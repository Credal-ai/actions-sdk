import { runAction } from "../../src/app.js";

async function runTest() {
  const result = await runAction(
    "getTopNSearchResultUrls",
    "bing",
    { apiKey: "insert-during-test" }, // authParams
    {
      query: "function calling",
      count: 5,
      site: "openai.com",
    },
  );
  console.log("Success:", result.success);
  console.log("Results count:", result.results?.length || 0);
  if (result.results) {
    for (const searchResult of result.results) {
      console.log(`- ${searchResult.name} (URL: ${searchResult.url})`);
    }
  }
  if (result.error) {
    console.log("Error:", result.error);
  }
}

runTest().catch(console.error);
