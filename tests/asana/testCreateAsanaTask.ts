import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "createTask",
    "asana",
    // Replace with actual valid test fields
    {authToken:"auth-token-here"} ,
    {
      name: `Test Task created on ${new Date().toISOString()}`,
      workspaceId: "workpace-id-here",
      projectId: "project-id-here",
      description: `This is a test task for Asana`,
      assignee: "test@vulcancollective.io",
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
      approvalStatus: "pending",
      taskTemplate:"test-template-name",
      custom_fields: {
        "1234567890123456": "Custom Value" 
      },
    }
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(result.taskUrl, "Response should contain a task URL");
  console.log(`Successfully created Asana task: ${result.taskUrl}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
