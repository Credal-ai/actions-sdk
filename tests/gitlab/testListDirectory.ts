import type { gitlabListDirectoryParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Running test gitlab search");

  const params: gitlabListDirectoryParamsType = {
    group: "credal",
    project: "test-project",
    path: "/",
  };

  const result = await runAction(
    "listDirectory",
    "gitlab",
    { authToken: process.env.GITLAB_ACCESS_TOKEN }, 
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });
  assert(Array.isArray(result.content), "Content should be an array");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});