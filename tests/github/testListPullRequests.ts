import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "listPullRequests",
    "github",
    {
      authToken: "insert-during-test", // authParams
    },
    {
      repositoryOwner: "insert-during-test",
      repositoryName: "insert-during-test",
    },
  );

  console.log(JSON.stringify(result, null, 2));

  // Validate response
  assert(result, "Response should not be null");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
