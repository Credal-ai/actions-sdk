import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
    // Set up test parameters
    const params = {
        // Snowflake database connection params (hard set by user):
        databaseName: "insert-database-name",
        warehouse: "insert-compute-warehouse",
        user: "insert-user-name",
        accountName: "insert-account-name",
        // Query param:
        query: "insert-query-here",
        outputFormat: "json" // or "csv"
    };

    const authParams = {
        apiKey: "insert-snowflake-private-key", // Private key in PEM format
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
        assert(result.rowCount, "Response should contain a row count");
        assert(result.content, "Response should contain a result content");
        console.log("Test passed! with content: " + result.content);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

// Uncomment the test you want to run
runTest().catch(error => {
    console.error("Test failed:", error);
    if (error.response) {
        console.error("API response:", error.response.data);
        console.error("Status code:", error.response.status);
    }
    process.exit(1);
});