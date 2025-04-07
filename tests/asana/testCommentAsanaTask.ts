import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "commentTask",
    "asana",
    // Replace with actual valid test fields
    { authToken: "auth-token-here" },
    {
      taskId: "task-id-here",
      commentText: `Test Comment created on ${new Date().toISOString()}`,
      isPinned: true,
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(result.commentUrl, "Response should contain a task URL");
  console.log(`Successfully created Asana task: ${result.commentUrl}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
