import assert from "node:assert";
import { runAction } from "../../src/app.js";
import { authenticateWithJWT } from "./utils.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();

  const result = await runAction(
    "generateSalesReport",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      filters: {
        StageName: "Closed Won",
      },
    }
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
