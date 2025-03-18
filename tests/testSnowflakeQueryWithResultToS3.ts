import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
    // Set up test parameters
    const params = {
        // Snowflake database connection params:
        databaseName: "insert-database-name",
        warehouse: "insert-compute-warehouse",
        user: "insert-user-name",
        accountName: "insert-account-name",
        // Query param:
        query: "insert-query-here",
        // S3 bucket params:
        s3BucketName: "insert-s3-bucket-name",
        s3Region: "insert-s3-region",
        // Optional parameters:
        outputFormat: "json" // or "csv"
    };

    const authParams = {
        apiKey: "insert-snowflake-private-key", // Private key in PEM format
        awsAccessKeyId: "insert-aws-access-key-id",
        awsSecretAccessKey: "insert-aws-secret-access-key"
    };
    
    try {
        // Run the action
        const result = await runAction(
            "runSnowflakeQueryWriteResultsToS3",
            "snowflake",
            authParams, 
            params
        );
            
        // Validate the response
        assert(result, "Response should not be null");
        assert(result.bucketUrl, "Response should contain the S3 bucket URL");
        assert(result.message, "Response should contain a result message");
        assert(typeof result.rowCount === 'number', "Response should contain a row count");
        
        console.log(`Successfully executed Snowflake query and wrote results to S3`);
        console.log(`- Bucket URL: ${result.bucketUrl}`);
        console.log(`- Row count: ${result.rowCount}`);
        console.log(`- Message: ${result.message}`);
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