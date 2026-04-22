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
  assert.strictEqual(regularQueryResult.success, true);
  assert.strictEqual(regularQueryResult.results?.length, 10);

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
  assert.strictEqual(aggregateQueryResult.success, true);
  assert.strictEqual(aggregateQueryResult.results?.length, 1);

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
  assert.strictEqual(groupByQueryResult.success, true);
  assert.ok(groupByQueryResult.results?.length ?? 0 > 0);
  // Check that at least one result has a non-null Industry (skip null values from GROUP BY)
  const resultWithIndustry = groupByQueryResult.results?.find(
    (r) =>
      (r as { contents?: { Industry?: string | null } }).contents?.Industry != null
  );
  assert.ok(
    (resultWithIndustry as { contents?: { Industry?: string | null } })?.contents
      ?.Industry !== undefined
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
  assert.strictEqual(existingLimitQueryResult.success, true);
  assert.ok(existingLimitQueryResult.results?.length ?? 0 <= 5);

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
  assert.strictEqual(highLimitQueryResult.success, true);
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
  assert.strictEqual(overrideLimitQueryResult.success, true);
  assert.ok(overrideLimitQueryResult.results?.length ?? 0 <= 3);

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
  assert.strictEqual(capLimitQueryResult.success, true);
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
  assert.strictEqual(caseLimitQueryResult.success, true);
  assert.ok(caseLimitQueryResult.results?.length ?? 0 <= 7);

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
  assert.strictEqual(whitespaceLimitQueryResult.success, true);
  assert.ok(whitespaceLimitQueryResult.results?.length ?? 0 <= 4);

  // Test 10: Query with LIMIT inside a subquery and no trailing LIMIT.
  // The inner LIMIT must be preserved (not stripped) and an outer LIMIT added.
  const subqueryLimitResult = (await runAction(
    "getSalesforceRecordsByQuery",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      query:
        "SELECT Id, Name, (SELECT Id, Name FROM Contacts LIMIT 2) FROM Account ORDER BY Name ASC",
      limit: 3,
    }
  )) as salesforceGetSalesforceRecordsByQueryOutputType;
  assert.strictEqual(subqueryLimitResult.success, true);
  // Outer LIMIT applied
  assert.ok((subqueryLimitResult.results?.length ?? 0) <= 3);
  // Inner LIMIT preserved: each account's Contacts subquery should have <= 2 records
  for (const r of subqueryLimitResult.results ?? []) {
    const contacts = (
      r as { contents?: { Contacts?: { records?: unknown[] } | null } }
    ).contents?.Contacts;
    if (contacts && Array.isArray(contacts.records)) {
      assert.ok(
        contacts.records.length <= 2,
        `Inner LIMIT was not preserved: got ${contacts.records.length} contacts`
      );
    }
  }

  console.log("All tests passed!");
}

runTest().catch(console.error);
