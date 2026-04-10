import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const authToken = process.env.HUBSPOT_AUTH_TOKEN;

  if (!authToken) {
    console.error("HUBSPOT_AUTH_TOKEN environment variable is required");
    process.exit(1);
  }

  const result = await runAction(
    "getContacts",
    "hubspot",
    { authToken },
    {
      query: "",
      limit: 250,
    },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(
    Array.isArray(result.contacts),
    "Response should contain contacts array",
  );
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
