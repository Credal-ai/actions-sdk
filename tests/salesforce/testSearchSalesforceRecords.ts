import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import {
  salesforceSearchSalesforceRecordsOutputSchema,
  type salesforceSearchSalesforceRecordsOutputType,
} from "../../src/actions/autogen/types.js";
import { authenticateWithJWT } from "./utils.js";

dotenv.config();

async function runTest() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();

  // Test 1: Regular query with limit
  const regularQueryResult = (await runAction(
    "searchSalesforceRecords",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      keyword: "Health",
      recordType: "Account",
      fieldsToSearch: ["Name"],
      limit: 1,
    }
  )) as salesforceSearchSalesforceRecordsOutputType;
  console.log(JSON.stringify(regularQueryResult, null, 2));
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
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      keyword: "health-company",
      recordType: "Account",
      fieldsToSearch: ["Name"],
      limit: 1,
    }
  );
  console.log(JSON.stringify(dashKeywordResult, null, 2));
  assert.strictEqual(dashKeywordResult.success, true);
  assert.equal(
    salesforceSearchSalesforceRecordsOutputSchema.safeParse(dashKeywordResult)
      .success,
    true
  );

  console.log("All tests passed!");
}

runTest().catch(console.error);
