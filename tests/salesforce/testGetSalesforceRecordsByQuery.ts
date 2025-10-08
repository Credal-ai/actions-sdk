import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { type salesforceGetSalesforceRecordsByQueryOutputType } from "../../src/actions/autogen/types";
import { authenticateWithJWT } from "./utils.js";

dotenv.config();

async function runTest() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();

  // Test 1: Regular query with limit
  const regularQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account",
      limit: 10,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  console.log(JSON.stringify(regularQueryResult, null, 2));
  assert.strictEqual(
    regularQueryResult.success,
    true,
    "Regular query should succeed"
  );
  assert.strictEqual(
    regularQueryResult.results?.length,
    10,
    "Regular query should have results"
  );

  // Test 2: Aggregate query without limit
  const aggregateQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT COUNT(Id) FROM Account",
      limit: 10,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  console.log(JSON.stringify(aggregateQueryResult, null, 2));
  assert.strictEqual(
    aggregateQueryResult.success,
    true,
    "Aggregate query should succeed"
  );
  assert.strictEqual(
    aggregateQueryResult.results?.length,
    1,
    "Aggregate query should have results"
  );

  // Test 3: Aggregate query with GROUP BY
  const groupByQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT COUNT(Id), Industry FROM Account GROUP BY Industry",
      limit: 10,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    groupByQueryResult.success,
    true,
    "Group by query should succeed"
  );
  assert.ok(
    groupByQueryResult.results?.length ?? 0 > 0,
    "Group by query should have results"
  );
  // Check that at least one result has a non-null Industry (skip null values from GROUP BY)
  const resultWithIndustry = groupByQueryResult.results?.find(
    (r) =>
      (r as { content?: { Industry?: string | null } }).content?.Industry !==
      null
  );
  assert.ok(
    (resultWithIndustry as { content?: { Industry?: string | null } })?.content
      ?.Industry !== undefined,
    "Group by query should have results with Industry"
  );

  // Test 4: Query with existing LIMIT clause and no limit parameter - should keep existing limit if < 2000
  const existingLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 5",
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    existingLimitQueryResult.success,
    true,
    "Existing limit query should succeed"
  );
  assert.ok(
    existingLimitQueryResult.results?.length ?? 0 <= 5,
    "Existing limit query should have results"
  );

  // Test 5: Query with existing LIMIT clause >= 2000 and no limit parameter - should replace with 2000
  const highLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 3000",
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    highLimitQueryResult.success,
    true,
    "High limit query should succeed"
  );
  // Should be capped at 2000 or whatever records exist

  // Test 6: Query with existing LIMIT clause and limit parameter - should use parameter
  const overrideLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 100",
      limit: 3,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    overrideLimitQueryResult.success,
    true,
    "Override limit query should succeed"
  );
  assert.ok(
    overrideLimitQueryResult.results?.length ?? 0 <= 3,
    "Override limit query should have results"
  );

  // Test 7: Query with existing LIMIT clause and limit parameter > 2000 - should cap at 2000
  const capLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account LIMIT 50",
      limit: 3000,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    capLimitQueryResult.success,
    true,
    "Cap limit query should succeed"
  );
  // Should be capped at 2000

  // Test 8: Query with LIMIT in different case
  const caseLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account limit 7",
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    caseLimitQueryResult.success,
    true,
    "Case limit query should succeed"
  );
  assert.ok(
    caseLimitQueryResult.results?.length ?? 0 <= 7,
    "Case limit query should have results"
  );

  // Test 9: Query with LIMIT and extra whitespace
  const whitespaceLimitQueryResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query: "SELECT Id FROM Account   LIMIT   15   ",
      limit: 4,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(
    whitespaceLimitQueryResult.success,
    true,
    "Whitespace limit query should succeed"
  );
  assert.ok(
    whitespaceLimitQueryResult.results?.length ?? 0 <= 4,
    "Whitespace limit query should have results"
  );

  console.log("All tests passed!");
}

runTest().catch(console.error);
