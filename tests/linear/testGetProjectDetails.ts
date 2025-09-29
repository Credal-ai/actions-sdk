import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getProjectDetails",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    { projectId: process.env.LINEAR_PROJECT_ID! },
  );

  assert(result.success, result.error || "getProjectDetails did not succeed");
  assert(result.project, "Project should be present");

  const project = result.project;
  assert(project.id, "Project should have an id");
  assert(project.name, "Project should have a name");
  assert(typeof project.state === "string", "Project should have a state");
  assert(typeof project.progress === "number", "Project should have progress");
  assert(typeof project.url === "string", "Project should have a url");
  assert(Array.isArray(project.updates), "Project should have updates array");
  assert(Array.isArray(project.issues), "Project should have issues array");

  if (project.lead) {
    assert(project.lead.id, "Lead should have an id");
    assert(project.lead.name, "Lead should have a name");
  }
  if (project.team) {
    assert(project.team.id, "Team should have an id");
    assert(project.team.name, "Team should have a name");
  }

  if (project.issues.length > 0) {
    const firstIssue = project.issues[0];
    assert(firstIssue.id, "Issue should have an id");
    assert(firstIssue.name, "Issue should have a name");
    assert(firstIssue.url, "Issue should have a url");
  }

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
