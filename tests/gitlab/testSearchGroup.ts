import type { gitlabSearchGroupParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runSearchGroupWithoutProject() {
  console.log("Running test gitlab search");

  const params: gitlabSearchGroupParamsType = {
    query: "test",
    groupId: "credal",
  };

  const result = await runAction(
    "searchGroup",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN }, 
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });
  assert(Array.isArray(result.mergeRequests), "Merge requests should be an array");
  assert(Array.isArray(result.blobs), "Blobs should be an array");
}

async function runSearchGroupWithProject() {
  console.log("Running test gitlab search");

  const params: gitlabSearchGroupParamsType = {
    query: "test",
    groupId: "credal",
    project: "test-project",
  };

  const result = await runAction(
    "searchGroup",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN }, 
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });
  assert(Array.isArray(result.mergeRequests), "Merge requests should be an array");
  assert(Array.isArray(result.blobs), "Blobs should be an array");
}

runSearchGroupWithoutProject().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});

runSearchGroupWithProject().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});