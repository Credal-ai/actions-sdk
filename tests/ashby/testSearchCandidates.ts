import { runAction } from "../../src/app.js";
import { authParams } from "./common";

async function runTest() {
  const result = await runAction("searchCandidates", "ashby", authParams, {
    name: "Test",
  });
  console.log(result);
}

runTest().catch(console.error);
