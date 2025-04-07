import { assert } from "node:console";
import { runAction } from "../src/app";

async function runTest() {
  const result = await runAction(
    "callCopilot",
    "credal",
    { apiKey: "insert-during-test" }, // authParams
    {
      agentId: "insert-during-test",
      query: "insert-during-test",
      userEmail: "insert-during-test",
    },
  );
  console.log(result);
  assert(result.response != null);
}

runTest().catch(console.error);
