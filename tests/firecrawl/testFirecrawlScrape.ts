import { runAction } from "../../src/app";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "scrapeUrl",
    "firecrawl",
    { apiKey: "insert-during-testing" }, // authParams
    {
      url: "https://carbonenewyork.com",
    },
  );
  console.log(result);
  assert(result.content.length > 0, "No content found");
}

runTest().catch(console.error);
