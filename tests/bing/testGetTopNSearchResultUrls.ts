import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getTopNSearchResultUrls",
    "bing",
    { apiKey: process.env.BING_API_KEY },
    {
      query: "function calling",
      count: 5,
      site: "openai.com",
    }
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
