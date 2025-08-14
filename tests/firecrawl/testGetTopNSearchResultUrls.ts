import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getTopNSearchResultUrls",
    "firecrawl",
    { apiKey: process.env.FIRECRAWL_API_KEY }, // authParams
    {
      query: "function calling",
      count: 5,
      site: "openai.com",
    },
  );
  console.log(result);
}

runTest().catch(console.error);
