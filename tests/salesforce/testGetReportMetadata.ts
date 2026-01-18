import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const accessToken = process.env.SALESFORCE_AUTH_TOKEN;
  const instanceUrl = process.env.SALESFORCE_URL;

  const result = await runAction(
    "getReportMetadata",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      reportId: process.env.SALESFORCE_REPORT_ID,
    }
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate the response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.metadata, "Response should contain metadata");
  console.log("Report metadata successfully retrieved.");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
