import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
import {
  salesforceSearchSalesforceRecordsOutputSchema,
  type salesforceSearchSalesforceRecordsOutputType,
} from "../../src/actions/autogen/types.js";
import { authenticateWithJWT } from "./utils.js";

dotenv.config();

async function runTest() {
  const { accessToken, instanceUrl } = await authenticateWithJWT();

  // Test 1: Regular query with limit
  const regularQueryResult = (await runAction(
    "searchSalesforceRecords",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      keyword: "Health",
      recordType: "Account",
      fieldsToSearch: ["Name"],
      limit: 1,
    }
  )) as salesforceSearchSalesforceRecordsOutputType;
  console.log("Result:", JSON.stringify(regularQueryResult, null, 2));

  // Validate response structure
  assert(regularQueryResult, "Response should not be null");
  assert.strictEqual(regularQueryResult.success, true, "Success should be true");
  assert(Array.isArray(regularQueryResult.results), "Results should be an array");
  assert.equal(
    salesforceSearchSalesforceRecordsOutputSchema.safeParse(regularQueryResult)
      .success,
    true
  );
  assert.equal(regularQueryResult.results?.length, 1);

  // Validate first result structure if results exist
  if (regularQueryResult.results && regularQueryResult.results.length > 0) {
    const firstResult = regularQueryResult.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

    // Validate contents has reasonable fields
    const contents = firstResult.contents;
    assert(
      contents.Id || contents.Name || contents.attributes,
      "Contents should have at least one reasonable field (Id, Name, or attributes)"
    );
  }

  const dashKeywordResult = await runAction(
    "searchSalesforceRecords",
    "salesforce",
    {
      authToken: accessToken,
      baseUrl: instanceUrl,
    },
    {
      keyword: "health-company",
      recordType: "Account",
      fieldsToSearch: ["Name"],
      limit: 1,
    }
  );
  console.log("Result (dash keyword):", JSON.stringify(dashKeywordResult, null, 2));
  assert.strictEqual(dashKeywordResult.success, true);
  assert(Array.isArray(dashKeywordResult.results), "Results should be an array");
  assert.equal(
    salesforceSearchSalesforceRecordsOutputSchema.safeParse(dashKeywordResult)
      .success,
    true
  );

  console.log("All tests passed!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
