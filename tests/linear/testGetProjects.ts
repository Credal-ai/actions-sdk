import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getProjects",
    "linear",
    { authToken: process.env.LINEAR_AUTH_TOKEN! },
    {}
  );

  assert(result.success, result.error || "getProjects did not succeed");
  assert(Array.isArray(result.results), "Projects should be an array");
  assert(result.results.length > 0, "Should return at least one project");

  const firstProject = result.results[0];
  assert(firstProject.contents.id, "Project should have an id");
  assert(firstProject.name, "Project should have a name");
  assert(
    typeof firstProject.contents.status === "string",
    "Project should have a status"
  );
  assert(
    Array.isArray(firstProject.contents.labels),
    "Project should have labels array"
  );
  assert(
    typeof firstProject.contents.progress === "number",
    "Project should have progress"
  );
  assert(typeof firstProject.url === "string", "Project should have a url");

  console.log("result: ", JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
