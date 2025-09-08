import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "scrapeUrl",
    "firecrawl",
    { apiKey: process.env.FIRECRAWL_API_KEY }, // authParams
    {
      url: "https://carbonenewyork.com",
      waitMs: 2000, // Wait 2 seconds before scraping
    },
  );
  console.log(result);
  assert(result.content.length > 0, "No content found");
}

runTest().catch(console.error);
