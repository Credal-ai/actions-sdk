import { assert } from "node:console";
import dotenv from "dotenv";
import { runAction } from "../../src/app.js";

dotenv.config();

async function runTest() {
  const basicFinancialsResult = await runAction(
    "getBasicFinancials",
    "finnhub",
    { apiKey: process.env.FINNHUB_API_KEY },
    { symbol: "AAPL" }
  );
  console.log(basicFinancialsResult);
  assert(
    basicFinancialsResult.result.annual.length > 0,
    "Annual financials should not be empty"
  );
  assert(
    basicFinancialsResult.result.quarterly.length > 0,
    "Quarterly financials should not be empty"
  );
}

runTest().catch(console.error);
