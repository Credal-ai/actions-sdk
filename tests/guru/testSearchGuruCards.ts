import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  if (!process.env.GURU_TOKEN) {
    console.log("Skipping Guru search test - GURU_TOKEN not set");
    return;
  }

  const result = await runAction(
    "searchGuruCards",
    "guru",
    { authToken: process.env.GURU_TOKEN },
    { query: "help", limit: 2 }
  );

  assert(result, "Response should not be null");
  assert(result.results !== undefined, "Results should be defined");
  assert(Array.isArray(result.results), "Results should be an array");
  console.log("Search Guru Cards Test Response: " + JSON.stringify(result, null, 2));
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
}); 