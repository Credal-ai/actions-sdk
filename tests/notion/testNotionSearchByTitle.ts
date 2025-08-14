import assert from "node:assert";
import { runAction } from "../../src/app.js";

async function runTest() {
  const result = await runAction(
    "searchByTitle",
    "notion",
    { authToken: "replace-me-with-token" },
    { query: "replace-me-withsearch-query" }
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(Array.isArray(result.results), "Results should be an array");
  console.log("Notion search results:", result.results);
}

runTest().catch((error) => {
 console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});