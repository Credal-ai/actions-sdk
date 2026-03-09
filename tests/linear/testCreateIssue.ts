import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "createIssue",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    {
      title: `Test issue ${new Date().toISOString()}`,
      description: "This is a test issue created by the automated test suite.",
      teamId: process.env.LINEAR_TEAM_ID!,
      projectId: process.env.LINEAR_PROJECT_ID,
    },
  );

  assert(result.success, result.error || "createIssue did not succeed");
  assert(result.issue, "Issue should be present in the response");

  const issue = result.issue;
  assert(issue.id, "Issue should have an id");
  assert(issue.title, "Issue should have a title");
  assert(issue.identifier, "Issue should have an identifier (e.g. ENG-123)");
  assert(typeof issue.url === "string", "Issue should have a url");

  console.log("Result: ", JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
