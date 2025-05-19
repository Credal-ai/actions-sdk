import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "getTasksDetails", 
    "asana",
    { authToken: "insert-auth-token-here" }, 
    { taskIds: ["taskId"], },
  );
  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(Array.isArray(result.results), "Results should be an array");

  console.log(`Found ${result.results.length} tasks:`);
  for (const task of result.results) {
    console.log(`${JSON.stringify(task)}`);
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