import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { salesforceSearchAllSalesforceRecordsOutputSchema, salesforceSearchAllSalesforceRecordsParamsSchema } from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.SALESFORCE_AUTH_TOKEN;
  const baseUrl = process.env.SALESFORCE_URL;

  // Test 1: Regular query with limit
  const regularQueryResult = await runAction(
    "searchAllSalesforceRecords",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      keyword: "Health",
      limit: 1
    }
  );

  assert.strictEqual(regularQueryResult.success, true);
  assert.equal(salesforceSearchAllSalesforceRecordsOutputSchema.safeParse(regularQueryResult).success, true);
  assert.equal(regularQueryResult.searchRecords.length, 1);
  
  console.log("All tests passed!");
}

runTest().catch(console.error);
