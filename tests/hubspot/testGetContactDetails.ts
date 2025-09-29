import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getContactDetails",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { contactId: process.env.HUBSPOT_CONTACT_ID },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.contact, "Response should contain contact data");
  assert(result.contact.id, "Contact should have an ID");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
