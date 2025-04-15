import assert from "node:assert";
import { runAction } from "../../src/app";
import { authenticateWithJWT } from "./utils";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = await authenticateWithJWT();
  const baseUrl = "https://platform-drive-9175.lightning.force.com/"; // Must be a valid Salesforce instance URL

  const result = await runAction(
    "fetchSalesforceSchemaByObject",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      objectType: "Account", // Specify the object type you want to fetch the schema for
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate the response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.reportData, "Response should contain report data");
  console.log("Sales report successfully generated.");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
