import { runAction } from "../../src/app.js";
import assert from "node:assert";

async function runTest() {
  const result = await runAction(
    "nearbysearchRestaurants",
    "googlemaps",
    { apiKey: "your-api-key" }, // authParams
    {
      latitude: 40.712776,
      longitude: -74.005974,
    },
  );

  console.log("Result:", JSON.stringify(result, null, 2));

  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.results), "Results should be an array");
  assert(result.results.length > 0, "Should have at least one result");

  const firstResult = result.results[0];
  assert(firstResult.name && typeof firstResult.name === "string", "First result should have a name (string)");
  assert(firstResult.url && typeof firstResult.url === "string", "First result should have a url (string)");
  assert(firstResult.contents && typeof firstResult.contents === "object", "First result should have contents (object)");


  const contents = firstResult.contents;
  assert(
    contents.name || contents.address || contents.rating || contents.primaryType,
    "Contents should have at least one reasonable field (name, address, rating, or primaryType)"
  );

  console.log("All tests passed!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
