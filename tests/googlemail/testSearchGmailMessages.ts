import type { googlemailSearchGmailMessagesParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Running test searchGmailMessages");

  const params: googlemailSearchGmailMessagesParamsType = {
    query: "test",
    maxResults: 1, // optional field
  };

  const result = await runAction(
    "searchGmailMessages",
    "googlemail",
    { authToken: process.env.GOOGLE_AUTH_TOKEN }, 
    params,
  );

  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert.strictEqual(result.success, true, "Search should be successful");
  assert(Array.isArray(result.results), "Results should be an array");
  if (result.results.length > 0) {
    const firstMsg = result.results[0];
    assert(firstMsg.name, "First message should have a name");
    assert(firstMsg.url, "First message should have a url");
    assert(firstMsg.contents, "First message should have contents");
    assert(firstMsg.contents.id, "First message should have an id");
    assert(firstMsg.contents.threadId, "First message should have a threadId");
    assert(typeof firstMsg.contents.snippet === "string", "First message should have a snippet");
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