import { googleOauthSearchGmailMessagesParamsType } from "../../src/actions/autogen/types";
import { runAction } from "../../src/app";
import assert from "node:assert";

async function runTest() {
  console.log("Running test searchGmailMessages");

  const result = await runAction(
    "searchGmailMessages",
    "googleOauth",
    { authToken: "insert-access-token-with-gmail-ready-only-scope" }, 
    {
      query: "insert-query-here",
      maxResults: 1, // optional field
    } as googleOauthSearchGmailMessagesParamsType,
  );

  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.messages), "Messages should be an array");
  if (result.messages.length > 0) {
    const firstMsg = result.messages[0];
    assert(firstMsg.id, "First message should have an id");
    assert(firstMsg.threadId, "First message should have a threadId");
    assert(typeof firstMsg.snippet === "string", "First message should have a snippet");
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