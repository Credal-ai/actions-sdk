import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getDeals",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { query: "", limit: 2 },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.deals), "Deals should be an array");
  if (result.deals.length > 0) {
    const deal = result.deals[0];
    assert(deal.id, "Deal should have an ID");
    assert("dealname" in deal, "Deal should have a dealname");
    assert("amount" in deal, "Deal should have an amount");
    assert("dealstage" in deal, "Deal should have a dealstage");
    assert("createdAt" in deal, "Deal should have a createdAt");
  }
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
