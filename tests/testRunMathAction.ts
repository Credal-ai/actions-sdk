import { runAction } from "../src/app";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "add",
    "math",
    {}, // authParams
    { a: 1, b: 2 },
  );

  assert(result.result === 3, "Result should be 3");
  console.log("Test mathAdd passed");
}

runTest().catch(console.error);
