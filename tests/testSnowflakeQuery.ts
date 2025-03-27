import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
  // Set up test parameters
  const params = {
    // Database connection params
    databaseName: "insert-database-name",
    warehouse: "insert-warehouse-name",
    user: "insert-user-name",
    accountName: "insert-account-name",
    // Query param
    query: "insert-query",
    outputFormat: "json", // or "csv"
  };

  const authParams = {
    authToken: "insert-oauth-access-token",
  }; 

  try {
    // Run the action
    const result = await runAction(
      "runSnowflakeQuery",
      "snowflake",
      authParams,
      params
    );

    // Validate the response
    assert(result, "Response should not be null");
    assert(result.rowCount >= 0, "Response should contain a row count");
    assert(result.content, "Response should contain a result content");
    assert((result.format == "csv" || result.format == "json"), "Response should contain a result format");
    console.log("Test passed! with content: " + result.content);
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
