import assert from "node:assert";
import { runAction } from "../../src/app.js";

async function runTest() {
  const result = await runAction(
    "searchTasks", 
    "asana",
    { authToken: "replace-me-with-auth-token" }, 
    { query: "replace-me-with-search-query", },
  );
  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(Array.isArray(result.results), "Matches should be an array");

  console.log(`Found ${result.results.length} matching tasks:`);
  for (const match of result.results) {
    console.log(`- ${match.name} (ID: ${match.id}) in Workspace ${match.workspaceId}`);
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