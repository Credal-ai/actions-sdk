import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "listAsanaTasksByProject",
    "asana",
    {
      authToken: process.env.ASANA_TOKEN!,
    },
    {
      projectId: process.env.ASANA_TEST_PROJECT_ID!,
    }
  );

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.tasks), "Response should contain tasks array");
  
  if (result.tasks.length > 0) {
    const firstTask = result.tasks[0];
    assert(firstTask.task, "Task should have task details");
    assert(firstTask.task.gid, "Task should have a gid");
    assert(firstTask.task.name, "Task should have a name");
    
    // Validate subtasks (if any)
    if (firstTask.subtasks && firstTask.subtasks.length > 0) {
      assert(firstTask.subtasks[0].gid, "Subtask should have a gid");
    }
    
    // Validate task stories (if any)
    if (firstTask.taskStories && firstTask.taskStories.length > 0) {
      assert(firstTask.taskStories[0].gid, "Task story should have a gid");
      assert(firstTask.taskStories[0].text, "Task story should have text");
    }
  }

  console.log(`Successfully retrieved ${result.tasks.length} tasks from Asana project`);
  console.log("Test passed successfully!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});