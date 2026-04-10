import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const accessToken = process.env.SALESFORCE_AUTH_TOKEN;
  const instanceUrl = process.env.SALESFORCE_URL;
  const reportId = process.env.SALESFORCE_REPORT_ID;

  if (!accessToken || !instanceUrl || !reportId) {
    throw new Error("Missing required environment variables: SALESFORCE_AUTH_TOKEN, SALESFORCE_URL, SALESFORCE_REPORT_ID");
  }

  console.log("Test 1: Execute report with details and summary");
  const resultWithSummary = await runAction(
    "executeReport",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      reportId: reportId,
      includeDetails: true,
      includeSummary: true,
    }
  );

  console.log(JSON.stringify(resultWithSummary, null, 2));

  // Validate the response with summary
  assert(resultWithSummary, "Response should not be null");
  assert(resultWithSummary.success, "Response should indicate success");
  assert(resultWithSummary.reportData, "Response should include reportData");
  assert(typeof resultWithSummary.reportData === "object", "reportData should be an object");
  assert(resultWithSummary.summary, "Response should include summary when includeSummary is true");
  assert(typeof resultWithSummary.summary === "object", "summary should be an object");
  console.log("✓ Test 1 passed: Report with summary executed successfully");

  console.log("\nTest 2: Execute report without summary");
  const resultWithoutSummary = await runAction(
    "executeReport",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      reportId: reportId,
      includeDetails: true,
      includeSummary: false,
    }
  );

  console.log(JSON.stringify(resultWithoutSummary, null, 2));

  // Validate the response without summary
  assert(resultWithoutSummary, "Response should not be null");
  assert(resultWithoutSummary.success, "Response should indicate success");
  assert(resultWithoutSummary.reportData, "Response should include reportData");
  assert(!resultWithoutSummary.summary, "Response should not include summary when includeSummary is false");
  console.log("✓ Test 2 passed: Report without summary executed successfully");

  console.log("\n✓ All tests passed!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
