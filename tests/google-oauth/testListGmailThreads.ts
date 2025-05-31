import { googleOauthListGmailThreadsParamsType } from "../../src/actions/autogen/types";
import { runAction } from "../../src/app";
import assert from "node:assert";

async function runTest() {
  console.log("Running test listGmailThreads");

  const result = await runAction(
    "listGmailThreads",
    "googleOauth",
    { authToken: "insert-access-token-with-gmail-ready-only-scope" }, 
    {
      query: "insert-query-here",
      maxResults: 1, // optional field
    } as googleOauthListGmailThreadsParamsType,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert.strictEqual(result.success, true, "List should be successful");
  assert(Array.isArray(result.threads), "Threads should be an array");
  if (result.threads.length > 0) {
    const firstThread = result.threads[0];
    assert(firstThread.id, "First thread should have an id");
    // Check for snippet in the first message of the first thread
    const firstMsg = Array.isArray(firstThread.messages) && firstThread.messages.length > 0
      ? firstThread.messages[0]
      : null;
    assert(
      firstMsg && typeof firstMsg.snippet === "string",
      "First message of first thread should have a snippet"
    );
    assert(Array.isArray(firstThread.messages), "Thread should have messages array");
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