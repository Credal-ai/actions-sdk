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
      timeLimit: 60,
      maxCredits: 100,
    },
  );
  console.log(result);
}

runTest().catch(console.error);
