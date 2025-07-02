import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = process.env.SALESFORCE_AUTH_TOKEN;
  const baseUrl = process.env.SALESFORCE_URL;

  // Test 1: Regular query with limit
  const regularQueryResult = await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT Id FROM Account",
      limit: 10
    }
  );
  assert.strictEqual(regularQueryResult.success, true);
  assert.strictEqual(regularQueryResult.records.records.length, 10);

  // Test 2: Aggregate query without limit
  const aggregateQueryResult = await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT COUNT(Id) FROM Account",
      limit: 10
    }
  );
  assert.strictEqual(aggregateQueryResult.success, true);
  assert.strictEqual(aggregateQueryResult.records.records.length, 1);

  // Test 3: Aggregate query with GROUP BY
  const groupByQueryResult = await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      query: "SELECT COUNT(Id), Industry FROM Account GROUP BY Industry",
      limit: 10
    }
  );
  assert.strictEqual(groupByQueryResult.success, true);
  assert.ok(groupByQueryResult.records.records.length > 0);
  assert.ok(groupByQueryResult.records.records[0].Industry !== undefined);

  console.log("All tests passed!");
}

runTest().catch(console.error);
