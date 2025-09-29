import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { type salesforceGetSalesforceRecordsByQueryOutputType } from "../../src/actions/autogen/types";

dotenv.config();

async function runTest() {
  const authToken = process.env.SALESFORCE_AUTH_TOKEN;
  const baseUrl = process.env.SALESFORCE_URL;

  // Test 1: Regular query with limit
  const regularQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account",
      limit: 10,
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(regularQueryResult.success, true);
  assert.strictEqual(regularQueryResult.results?.length, 10);

  // Test 2: Aggregate query without limit
  const aggregateQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT COUNT(Id) FROM Account",
      limit: 10,
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(aggregateQueryResult.success, true);
  assert.strictEqual(aggregateQueryResult.results?.length, 1);

  // Test 3: Aggregate query with GROUP BY
  const groupByQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT COUNT(Id), Industry FROM Account GROUP BY Industry",
      limit: 10,
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(groupByQueryResult.success, true);
  assert.ok(groupByQueryResult.results?.length ?? 0 > 0);
  assert.ok(groupByQueryResult.results?.[0].Industry !== undefined);

  // Test 4: Query with existing LIMIT clause and no limit parameter - should keep existing limit if < 2000
  const existingLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 5",
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(existingLimitQueryResult.success, true);
  assert.ok(existingLimitQueryResult.results?.length ?? 0 <= 5);

  // Test 5: Query with existing LIMIT clause >= 2000 and no limit parameter - should replace with 2000
  const highLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 3000",
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(highLimitQueryResult.success, true);
  // Should be capped at 2000 or whatever records exist

  // Test 6: Query with existing LIMIT clause and limit parameter - should use parameter
  const overrideLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 100",
      limit: 3,
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(overrideLimitQueryResult.success, true);
  assert.ok(overrideLimitQueryResult.results?.length ?? 0 <= 3);

  // Test 7: Query with existing LIMIT clause and limit parameter > 2000 - should cap at 2000
  const capLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 50",
      limit: 3000,
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(capLimitQueryResult.success, true);
  // Should be capped at 2000

  // Test 8: Query with LIMIT in different case
  const caseLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account limit 7",
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(caseLimitQueryResult.success, true);
  assert.ok(caseLimitQueryResult.results?.length ?? 0 <= 7);

  // Test 9: Query with LIMIT and extra whitespace
  const whitespaceLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account   LIMIT   15   ",
      limit: 4,
    },
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(whitespaceLimitQueryResult.success, true);
  assert.ok(whitespaceLimitQueryResult.results?.length ?? 0 <= 4);

  console.log("All tests passed!");
}

runTest().catch(console.error);
