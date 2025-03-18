import assert from "node:assert";
import { runAction } from "../src/app";

async function runTest() {
    // Set up test parameters
    const params = {
        databaseName: "insert-your-database-name",
        warehouse: "insert-your-warehouse-name",
        query: "insert-your-snowflake-sql-query",
        user: "insert-your-snowflake-user",
        accountName: "insert-your-snowflake-account-name",
        s3BucketName: "insert-your-s3-bucket-name",
        s3ObjectKey: "insert-your-s3-object-key",
        // Optional parameters
        s3Region: "us-east-1",
        outputFormat: "json" // or "csv"
    };
    
    const authParams = {
        apiKey: "YOUR_SNOWFLAKE_PRIVATE_KEY", // Private key in PEM format
        awsAccessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
        awsSecretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY"
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