import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getDealDetails",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { dealId: process.env.HUBSPOT_DEAL_ID },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.deal, "Response should contain deal data");
  assert(result.deal.id, "Deal should have an ID");
  assert("dealname" in result.deal, "Deal should have a dealname");
  assert("amount" in result.deal, "Deal should have an amount");
  assert("dealstage" in result.deal, "Deal should have a dealstage");
  assert("pipeline" in result.deal, "Deal should have a pipeline");
  assert("dealtype" in result.deal, "Deal should have a dealtype");
  assert("closedate" in result.deal, "Deal should have a closedate");
  assert("createdAt" in result.deal, "Deal should have a createdAt");
  assert("updatedAt" in result.deal, "Deal should have an updatedAt");
  assert("ownerId" in result.deal, "Deal should have an owner id");
  assert("archived" in result.deal, "Deal should have an archived field");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
