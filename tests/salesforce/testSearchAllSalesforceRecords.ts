import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import { salesforceSearchAllSalesforceRecordsOutputSchema } from "../../src/actions/autogen/types.js";
import { authenticateWithJWT } from "./utils.js";

dotenv.config();

// NOTE: SOSL uses search indexes that update asynchronously.
// If this test fails with 0 results, wait 1-2 minutes for indexing to complete.
// When searching across multiple objects, the LIMIT applies to total results across ALL objects.

/*
There is an issue when limit is 1 and the result returns 0 even if there are matching records. It is unknown why this happens currently. Claude suggests the following reasons:
1. SOSL Relevancy AI Issue: When searching across 6 different object types (Contact, Account, Lead, Opportunity, Task, Case) with LIMIT 1, Salesforce's relevancy algorithm may be trying to find the single "most relevant" result across all types, and something in its scoring/ranking is failing to pick any result.
2. Index Selection Problem: SOSL uses different indexes depending on the query. With LIMIT 1, it might be using a different index selection strategy that's incompatible with your multi-object query.
3. Known SOSL Blackbox Behavior: As mentioned in the search results, "The SOSL search algorithm is a blackbox including some relevancy AI" - this unpredictable behavior is unfortunately a known characteristic.
*/

async function runTest() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();

  // Test with LIMIT 1
  console.log("\n=== Test with LIMIT 1 ===");
  const result1 = await runAction(
    "searchAllSalesforceRecords",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      keyword: "Health",
      limit: 1,
    }
  );
  console.log("Result (LIMIT 1):", JSON.stringify(result1, null, 2));

  // Validate response structure for LIMIT 1
  assert(result1, "Response should not be null");
  assert.strictEqual(result1.success, true, "Success should be true");
  assert(Array.isArray(result1.results), "Results should be an array");

  // Test with LIMIT 10
  console.log("\n=== Test with LIMIT 10 ===");
  const result10 = await runAction(
    "searchAllSalesforceRecords",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      keyword: "Health",
      limit: 10,
    }
  );
  console.log("Result (LIMIT 10):", JSON.stringify(result10, null, 2));

  // Validate response structure for LIMIT 10
  assert(result10, "Response should not be null");
  assert.strictEqual(result10.success, true, "Success should be true");
  assert(Array.isArray(result10.results), "Results should be an array");
  assert.equal(
    salesforceSearchAllSalesforceRecordsOutputSchema.safeParse(result10)
      .success,
    true
  );

  // Verify we get results with higher limit
  assert.ok(
    result10.results?.length ?? 0 >= 1,
    "Should find at least 1 result with LIMIT 10"
  );

  // Validate first result structure if results exist
  if (result10.results && result10.results.length > 0) {
    const firstResult = result10.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

    // Validate contents has reasonable fields
    const contents = firstResult.contents;
    assert(
      contents.Id || contents.Name || contents.attributes,
      "Contents should have at least one reasonable field (Id, Name, or attributes)"
    );
  }

  console.log("All tests passed!");
  console.log(`LIMIT 1 found: ${result1.results?.length ?? 0} result(s)`);
  console.log(`LIMIT 10 found: ${result10.results?.length ?? 0} result(s)`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
