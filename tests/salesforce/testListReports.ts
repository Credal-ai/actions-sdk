import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = process.env.SALESFORCE_AUTH_TOKEN;
  const baseUrl = process.env.SALESFORCE_URL;

  if (!authToken || !baseUrl) {
    throw new Error("Missing required environment variables: SALESFORCE_AUTH_TOKEN, SALESFORCE_URL");
  }

  const result = await runAction(
    "listReports",
    "salesforce",
    {
      authToken: authToken,
      baseUrl: baseUrl,
    },
    {}
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate the response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.reports, "Response should contain reports");
  assert(Array.isArray(result.reports), "Reports should be an array");
  console.log(`Successfully retrieved ${result.reports.length} reports.`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
