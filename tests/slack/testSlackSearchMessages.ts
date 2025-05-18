import assert from "node:assert";
import { runAction } from "../../src/app";

async function testSlackSearchMessages() {
  const result = await runAction(
    "searchMessages",
    "slack",
    { authToken: "replace-me-with-user-token-not-bot-token" },
    { query: "replace-me-with-search-query" }
  );

  console.log("Slack searchMessages result:", result);

  assert(result, "Response should not be null");
  assert.strictEqual(result.success, true, `Slack searchMessages failed: ${result.error}`);
  assert.ok(Array.isArray(result.results), "Expected results to be an array");
}

testSlackSearchMessages().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});