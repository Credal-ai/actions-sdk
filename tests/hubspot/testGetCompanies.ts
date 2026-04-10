import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getCompanies",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { query: "", limit: 2 },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.companies), "Companies should be an array");
  if (result.companies.length > 0) {
    const company = result.companies[0];
    assert(company.id, "Company should have an ID");
    assert("name" in company, "Company should have a name");
    assert("domain" in company, "Company should have a domain");
    assert("createdAt" in company, "Company should have a createdAt");
  }
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
