import assert from "node:assert";
import { runAction } from "../../src/app.js";

async function runTest() {
  // Set up test parameters
  const params = {
    // Database connection params
    databaseName: "insert-database-name",
    warehouse: "insert-warehouse-name",
    accountName: "insert-account-name",
    // Query param
    query: "insert-query",
    outputFormat: "json", // or "csv"
  };

  const authParams = {
    apiKey: "insert-private-key", // Private Key for Key-pair authentication
    username: "insert-username", // Username for Key-pair authentication
  };

  try {
    // Run the action
    const result = await runAction(
      "runSnowflakeQuery",
      "snowflake",
      authParams,
      params,
    );

    console.log("Result:", JSON.stringify(result, null, 2));

    // Validate response structure
    assert(result, "Response should not be null");
    assert.strictEqual(result.success, true, "Success should be true");
    assert(Array.isArray(result.results), "Results should be an array");

    // Validate first result structure if results exist
    if (result.results.length > 0) {
      const firstResult = result.results[0];
      assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
      assert(typeof firstResult.url === "string", "First result should have a url (string)");
      assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

      // Validate contents has reasonable fields
      const contents = firstResult.contents;
      assert(contents.rowCount !== undefined, "Contents should have rowCount");
      assert(contents.content, "Contents should have content");
      assert(
        contents.format === "csv" || contents.format === "json",
        "Contents format should be csv or json"
      );
    }

    console.log("All tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Uncomment the test you want to run
runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
