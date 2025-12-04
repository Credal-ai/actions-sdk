import type { gitlabGetMergeRequestParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTestProjectId() {
  console.log("Running test gitlab getMergeRequest with project ID");

  const params: gitlabGetMergeRequestParamsType = {
    project_id: 71071238,
    mr_iid: "1",
  };

  const result = await runAction(
    "getMergeRequest",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN },
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert(typeof result === "object", "Result should be an object");
  assert("success" in result, "Result should have 'success'");
  if (result.success) {
    assert(typeof result.results?.[0]?.metadata?.title === "string", "Title should be a string");
    assert(typeof result.results?.[0]?.changes[0]?.diff === "string", "Diff should be a string");
    assert(typeof result.results?.[0]?.commits[0]?.message === "string", "Message should be a string");
  } else {
    assert(typeof result.error === "string", "Error should be a string when not successful");
    console.error("Failed to get merge request:", result.error);
  }
}

async function runTestProjectPath() {
  console.log("Running test gitlab getMergeRequest with project path");

  const params: gitlabGetMergeRequestParamsType = {
    project_path: "credal/test-project",
    mr_iid: "1",
  };

  const result = await runAction(
    "getMergeRequest",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN },
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });

  assert(typeof result === "object", "Result should be an object");
  assert("success" in result, "Result should have 'success'");
  if (result.success) {
    assert(typeof result.results?.[0]?.metadata?.title === "string", "Title should be a string");
    assert(typeof result.results?.[0]?.changes[0]?.diff === "string", "Diff should be a string");
    assert(typeof result.results?.[0]?.commits[0]?.message === "string", "Message should be a string");
  } else {
    assert(typeof result.error === "string", "Error should be a string when not successful");
    console.error("Failed to get merge request:", result.error);
  }
}

runTestProjectId().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});

runTestProjectPath().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});