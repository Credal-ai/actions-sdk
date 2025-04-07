import assert from "node:assert";
import { runAction } from "../../src/app";
import { authenticateWithJWT } from "./utils";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = await authenticateWithJWT();
  const baseUrl = "https://power-speed-8849.my.salesforce.com/"; // Must be a valid Salesforce instance URL

  const result = await runAction(
    "createCase",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      subject: `Test Case Subject - ${new Date().toISOString()}`,
      description: "This is a test case created via the Salesforce API.",
      priority: "High",
      origin: "Web",
      customFields: {
        Reason: "Test Reason",
      },
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate the response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.caseId, "Response should contain the case ID");
  console.log("Case successfully created. Case ID:", result.caseId);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
