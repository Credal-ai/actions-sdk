import assert from "node:assert";
import { runAction } from "../src/app";


async function runTest() {
  // Mock the API endpoint
  const endpoint = "https://jsonplaceholder.typicode.com/posts/1";

  // Test GET request
  const getResult = await runAction(
    "universalTestAction",
    "generic",
    {},
    {
      endpoint: `${endpoint}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    },
  );

  assert(getResult, "GET response should not be null");
  assert.strictEqual(getResult.statusCode, 200, "Status code should be 200");
  console.log("Output is", getResult);
  console.log("Successfully tested universalTestAction");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});