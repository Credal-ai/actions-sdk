import { runAction } from "../../src/app";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "symbolLookup",
    "finnhub",
    { apiKey: "insert-api-key" },
    { query: "AAPL" },
  );
  console.log(result);
  assert(result.result.length > 0, "Result should not be empty");

  const basicFinancialsResult = await runAction(
    "getBasicFinancials",
    "finnhub",
    { apiKey: "insert-api-key" },
    { symbol: "AAPL" },
  );
  console.log(basicFinancialsResult);
  assert(
    basicFinancialsResult.result.annual.length > 0,
    "Annual financials should not be empty",
  );
  assert(
    basicFinancialsResult.result.quarterly.length > 0,
    "Quarterly financials should not be empty",
  );
}

runTest().catch(console.error);
