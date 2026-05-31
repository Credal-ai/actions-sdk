import { runAction } from "../../src/app.js";
import type { finnhubSymbolLookupOutputType } from "../../src/actions/autogen/types.js";
import {
  axiosClient,
  ApiError,
  isAxiosTimeoutError,
} from "../../src/actions/util/axiosClient.js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.FINNHUB_API_KEY;

if (!apiKey) {
  console.error("FINNHUB_API_KEY not found in .env");
  process.exit(1);
}

type LookupResultItem = finnhubSymbolLookupOutputType["result"][number];

async function runTest() {
  console.log("FINNHUB_API_KEY present, length:", apiKey!.length);

  // First, sanity check using the exact same axiosClient the SDK uses
  console.log("\n--- Direct axiosClient test (same client as SDK) ---");
  try {
    const direct = await axiosClient.get(
      "https://finnhub.io/api/v1/search?q=AAPL",
      {
        headers: { "X-Finnhub-Token": apiKey },
      },
    );
    console.log(
      "Direct via axiosClient OK, first symbol:",
      direct.data.result?.[0]?.symbol,
    );
  } catch (e: unknown) {
    console.error("Direct axiosClient call failed:");
    if (e instanceof ApiError) {
      console.error("  ApiError message:", e.message);
      console.error("  status:", e.status);
      console.error("  data:", e.data);
    } else if (e instanceof Error) {
      console.error("  Error:", e.message);
      console.error("  stack:", e.stack);
    } else {
      console.dir(e, { depth: 3 });
    }
    throw e;
  }

  // Now test via the public runAction API
  console.log("\n--- Via runAction (symbolLookup with ticker AAPL) ---");
  const symRes = await runAction(
    "symbolLookup",
    "finnhub",
    { apiKey },
    { query: "AAPL" },
  );
  console.log("symbolLookup(AAPL) result count:", symRes.result.length);
  console.log("First 3:", symRes.result.slice(0, 3));

  const hasAapl = symRes.result.some(
    (r: LookupResultItem) => r.symbol === "AAPL",
  );
  console.log("Contains exact AAPL?", hasAapl);
  if (!hasAapl) {
    console.warn(
      "Note: exact AAPL not present (may still be OK depending on ranking)",
    );
  }

  console.log("\n--- Via runAction (symbolLookup freetext 'apple') ---");
  const nameRes = await runAction(
    "symbolLookup",
    "finnhub",
    { apiKey },
    { query: "apple" },
  );
  console.log("symbolLookup('apple') result count:", nameRes.result.length);
  console.log("First 2:", nameRes.result.slice(0, 2));

  console.log("\n--- Via runAction (getBasicFinancials AAPL) ---");
  const finRes = await runAction(
    "getBasicFinancials",
    "finnhub",
    { apiKey },
    { symbol: "AAPL" },
  );
  console.log("annual metrics:", finRes.result.annual?.length ?? 0);
  console.log("quarterly metrics:", finRes.result.quarterly?.length ?? 0);
  if (finRes.result.annual && finRes.result.annual.length > 0) {
    console.log("sample annual metric[0]:", finRes.result.annual[0]);
  }

  // Type/shape assertions for tightness (schema now requires both fields)
  console.log("\n--- Type/shape checks ---");
  for (const item of symRes.result) {
    if (typeof item.symbol !== "string" || item.symbol.length === 0) {
      throw new Error("symbol must be a non-empty string");
    }
    if (typeof item.description !== "string") {
      throw new Error("description must be a string");
    }
  }
  console.log(
    "Result items have required string symbol + description (tight schema).",
  );

  console.log("\n✅ All finnhub real tests completed successfully.");
}

runTest().catch((err) => {
  console.error("\n❌ Test failed with error:");
  if (err instanceof ApiError) {
    console.error(
      "ApiError:",
      err.message,
      "status:",
      err.status,
      "data:",
      err.data,
    );
  } else if (err instanceof Error) {
    console.error(err.stack || err.message);
  } else {
    console.dir(err, { depth: 5 });
  }
  process.exit(1);
});
