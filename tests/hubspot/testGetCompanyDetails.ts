import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getCompanyDetails",
    "hubspot",
    { authToken: process.env.HUBSPOT_AUTH_TOKEN },
    { companyId: process.env.HUBSPOT_COMPANY_ID },
  );

  console.log("Response: ", JSON.stringify(result, null, 2));

  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(result.company, "Response should contain company data");
  assert(result.company.id, "Company should have an ID");
  assert("name" in result.company, "Company should have a name");
  assert("domain" in result.company, "Company should have a domain");
  assert("industry" in result.company, "Company should have an industry");
  assert("phone" in result.company, "Company should have a phone");
  assert("address" in result.company, "Company should have an address");
  assert("city" in result.company, "Company should have a city");
  assert("state" in result.company, "Company should have a state");
  assert("zip" in result.company, "Company should have a zip");
  assert("country" in result.company, "Company should have a country");
  assert("website" in result.company, "Company should have a website");
  assert("createdAt" in result.company, "Company should have a createdAt");
  assert("updatedAt" in result.company, "Company should have an updatedAt");
  assert("archived" in result.company, "Company should have an archived field");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
