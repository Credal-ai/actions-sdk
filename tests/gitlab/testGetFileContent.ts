import type { gitlabGetFileContentParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Running test gitlab getFileContent");

  // TODO: Replace with a real project ID and a valid file path in your test repo
  const params: gitlabGetFileContentParamsType = {
    project_id: 71071238,                // <--- Put a real GitLab project ID here
    path: "README.md",                   // <--- And a real file path (e.g., "src/index.js")
    // ref: "main",                      // Optional, defaults to "HEAD"
  };

  const result = await runAction(
    "getFileContent",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN },
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert(typeof result === "object", "Result should be an object");
  assert("success" in result, "Result should have 'success'");
  if (result.success) {
    assert(typeof result.results?.[0]?.contents?.content === "string", "Content should be a string");
    assert(typeof result.results?.[0]?.name === "string", "Name should be a string");
    assert(typeof result.results?.[0]?.url === "string", "url should be a string");
  } else {
    assert(typeof result.error === "string", "Error should be a string when not successful");
    console.error("Failed to get file content:", result.error);
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