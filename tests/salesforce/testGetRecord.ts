import assert from "node:assert";
import { runAction } from "../../src/app";
import { authenticateWithJWT } from "./utils";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = await authenticateWithJWT();
  const baseUrl = "https://power-speed-8849.my.salesforce.com/"; // Must be a valid Salesforce instance URL

  const result = await runAction(
    "getRecord",
    "salesforce",
    {
      authToken,
      baseUrl,
    },
    {
      objectType: "Lead", // Replace with the object type you want to retrieve
      recordId: "00Qfn0000004na7EAA", // Replace with a valid record ID
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate the response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.record, "Response should contain the record data");
  console.log("Record successfully retrieved:", result.record);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
