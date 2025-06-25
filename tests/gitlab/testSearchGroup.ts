import type { gitlabSearchGroupParamsType } from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";

async function runTest() {
  console.log("Running test gitlab search");

  const params: gitlabSearchGroupParamsType = {
    query: "test",
    groupId: "1234567890",
  };

  const result = await runAction(
    "searchGroup",
    "gitlab",
    { authToken: "test-oauth-token" }, 
    params,
  );
  console.log("Resulting payload:");
  console.dir(result, { depth: 4 });
  assert(Array.isArray(result.mergeRequests), "Merge requests should be an array");
  assert(Array.isArray(result.blobs), "Blobs should be an array");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});