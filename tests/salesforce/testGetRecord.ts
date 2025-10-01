import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { authenticateWithJWT } from "./utils.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();

  const result = await runAction(
    "getRecord",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      objectType: "Lead", // Replace with the object type you want to retrieve
      recordId: "00Qfj000004TxnBEAS", // Replace with a valid record ID
    }
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
