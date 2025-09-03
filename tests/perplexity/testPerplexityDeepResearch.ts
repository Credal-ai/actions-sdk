import { runAction } from "../../src/app.js";

async function runTest() {
  const result = await runAction(
    "perplexityDeepResearch",
    "perplexity",
    { apiKey: process.env.PERPLEXITY_API_KEY }, // authParams
    {
      query: "research cereal",
      reasoningEffort: "low",
    },
  );
  console.log(result);
}

runTest().catch(console.error);
