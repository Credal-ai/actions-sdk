import assert from "node:assert";
import { runAction } from "../../src/app.js";

import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getIssues",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    { query: "500", maxResults: 25 },
  );

  assert(result.success, result.error || "getIssues did not succeed");
  assert(Array.isArray(result.issues), "Issues should be an array");
  assert(result.issues.length > 0, "Should return at least one issue");

  const firstIssue = result.issues[0];
  assert(firstIssue.id, "Issue should have an id");
  assert(firstIssue.title, "Issue should have a title");
  assert(Array.isArray(firstIssue.labels), "Issue should have labels array");
  assert(typeof firstIssue.state === "string", "Issue should have a state");
  assert(typeof firstIssue.url === "string", "Issue should have a url");
  assert(
    Array.isArray(firstIssue.comments),
    "Issue should have comments array",
  );

  console.log("Response: ", JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
