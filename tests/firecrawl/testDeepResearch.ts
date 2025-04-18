import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "deepResearch",
    "firecrawl",
    { apiKey: "insert-during-test" }, // authParams
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
