import assert from "node:assert";
import { runAction } from "../../src/app";
import { authenticateWithJWT } from "./utils";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = await authenticateWithJWT();
  const baseUrl = "https://power-speed-8849.my.salesforce.com/"; // Must be a valid Salesforce instance URL
  const recordId = "00Qfn0000004na7EAA"; // Must be a valid lead ID in your Salesforce instance
  const objectType = "Lead"; // Must be a valid object type of recordId object

  const fieldsToUpdate = {
    FirstName: "Updated Actions SDK First Name",
    LastName: "UpdatedLastName",
    Company: `UpdatedCompany-${Date.now()}`,
    Status: "Contacted",
    Phone: "1234567890",
  };

  const result = await runAction(
    "updateRecord",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      objectType,
      recordId,
      fieldsToUpdate,
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate the response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  console.log("Lead successfully updated.");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
