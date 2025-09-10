import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const result = await runAction(
    "deepResearch",
    "firecrawl",
    { apiKey: process.env.FIRECRAWL_API_KEY }, // authParams
    {
      query: "research cereal",
      maxDepth: 2,
      maxUrls: 5,
      timeLimit: 60,
    },
  );
  console.log(result);
}

runTest().catch(console.error);
