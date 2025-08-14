import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "searchAndScrape",
    "firecrawl",
    { apiKey: process.env.FIRECRAWL_API_KEY }, // authParams
    {
      query: "openai",
    },
  );
  console.log(result);
  assert(result.results.length > 0, "No content found");
}

runTest().catch(console.error);
