import { runAction } from "../../src/app";

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
  console.log(result);
}

runTest().catch(console.error);
