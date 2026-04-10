import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getIssueDetails",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    { issueId: process.env.LINEAR_TEST_ISSUE_ID! },
  );

  assert(result.success, result.error || "getIssueDetails did not succeed");
  assert(result.issue, "Issue should be present");

  const issue = result.issue;
  assert(issue.id, "Issue should have an id");
  assert(issue.title, "Issue should have a title");
  assert(typeof issue.state === "string", "Issue should have a state");
  assert(Array.isArray(issue.labels), "Issue should have labels array");
  assert(typeof issue.url === "string", "Issue should have a url");
  assert(Array.isArray(issue.comments), "Issue should have comments array");

  // Check object format for assignee, creator, team, project
  if (issue.assignee) {
    assert(issue.assignee.id, "Assignee should have an id");
    assert(issue.assignee.name, "Assignee should have a name");
  }
  if (issue.creator) {
    assert(issue.creator.id, "Creator should have an id");
    assert(issue.creator.name, "Creator should have a name");
  }
  if (issue.team) {
    assert(issue.team.id, "Team should have an id");
    assert(issue.team.name, "Team should have a name");
  }
  if (issue.project) {
    assert(issue.project.id, "Project should have an id");
    assert(issue.project.name, "Project should have a name");
  }

  console.log(JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
