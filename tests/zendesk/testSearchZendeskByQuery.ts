import assert from "node:assert";
import { runAction } from "../../src/app.js";

async function runTest() {
  const result = await runAction(
    "searchZendeskByQuery",
    "zendesk",
    {
      authToken: "insert-auth-token",
    }, // authParams
    {
      subdomain: "insert-subdomain",
      query: "status:closed priority:high",
      objectType: "ticket",
      limit: 5,
    }
  );

  console.log("Result:", JSON.stringify(result, null, 2));

  // Validate response structure
  assert(result, "Response should not be null");
  assert.strictEqual(result.success, true, "Success should be true");
  assert(Array.isArray(result.results), "Results should be an array");

  // Validate first result structure if results exist
  if (result.results.length > 0) {
    const firstResult = result.results[0];
    assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
    assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
    assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");

    // Validate contents has reasonable fields
    const contents = firstResult.contents;
    assert(
      contents.id || contents.subject || contents.status,
      "Contents should have at least one reasonable field (id, subject, or status)"
    );
  }

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