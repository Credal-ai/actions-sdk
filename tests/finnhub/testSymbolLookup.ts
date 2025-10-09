import { assert } from "node:console";
import dotenv from "dotenv";
import { runAction } from "../../src/app.js";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "symbolLookup",
    "finnhub",
    { apiKey: process.env.FINNHUB_API_KEY },
    { query: "AAPL" }
  );
  console.log(result);
  assert(result.results.length > 0, "Result should not be empty");
}

runTest().catch(console.error);
