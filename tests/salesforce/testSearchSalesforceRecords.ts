import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import {
  salesforceSearchSalesforceRecordsOutputSchema,
  type salesforceSearchSalesforceRecordsOutputType,
} from "../../src/actions/autogen/types.js";

dotenv.config();

async function runTest() {
  const authToken = process.env.SALESFORCE_AUTH_TOKEN;
  const baseUrl = process.env.SALESFORCE_URL;

  // Test 1: Regular query with limit
  const regularQueryResult = (await runAction(
    "searchSalesforceRecords",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      keyword: "Health",
      recordType: "Account",
      fieldsToSearch: ["Name"],
      limit: 1,
    }
  )) as salesforceSearchSalesforceRecordsOutputType;
  assert.strictEqual(regularQueryResult.success, true);
  assert.equal(
    salesforceSearchSalesforceRecordsOutputSchema.safeParse(regularQueryResult)
      .success,
    true
  );
  assert.equal(regularQueryResult.results?.length, 1);

  const dashKeywordResult = await runAction(
    "searchSalesforceRecords",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      keyword: "health-company",
      recordType: "Account",
      fieldsToSearch: ["Name"],
      limit: 1,
    }
  );
  assert.strictEqual(dashKeywordResult.success, true);
  assert.equal(
    salesforceSearchSalesforceRecordsOutputSchema.safeParse(dashKeywordResult)
      .success,
    true
  );

  console.log("All tests passed!");
}

runTest().catch(console.error);
