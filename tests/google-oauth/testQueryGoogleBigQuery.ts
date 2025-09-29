import type { googleOauthQueryGoogleBigQueryParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";

/**
 * Test for querying Google BigQuery
 */
async function runTest() {
  console.log("Running test queryGoogleBigQuery");

  const result = await runAction(
    "queryGoogleBigQuery",
    "googleOauth",
    {
      authToken: "insert-access-token", // https://www.googleapis.com/auth/bigquery.readonly
    },
    {
      query: "SELECT * FROM `proejctName.TableName` LIMIT 1000",
      maxResults: 1000,
      timeoutMs: 30000,
      maximumBytesProcessed: "1000000000", // 1GB limit for this test
      projectId: "ornate-entropy-468019-e6",
    } as googleOauthQueryGoogleBigQueryParamsType,
  );

  // Validate the result
  assert.strictEqual(result.success, true, "Query should be successful");

  if (result.data) {
    assert(Array.isArray(result.data), "Data should be an array");
    console.log("Query results:", result.data);

    if (result.data.length > 0) {
      const firstRow = result.data[0];
      assert(typeof firstRow === "object", "First row should be an object");
      console.log("First row:", firstRow);
    }
  }

  if (result.schema) {
    assert(Array.isArray(result.schema), "Schema should be an array");
    console.log("Schema:", result.schema);

    if (result.schema.length > 0) {
      const firstColumn = result.schema[0];
      assert(firstColumn.name, "First column should have a name");
      assert(firstColumn.type, "First column should have a type");
    }
  }

  if (result.totalRows) {
    assert(
      typeof result.totalRows === "string",
      "Total rows should be a string",
    );
    console.log("Total rows:", result.totalRows);
  }

  console.log("BigQuery test completed successfully");
}

// Run the test
runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
