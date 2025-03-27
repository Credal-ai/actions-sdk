import { runAction } from "../../src/app";
import { authParams } from "./common";

async function runTest() {
  const result = await runAction(
    "listCandidates",
    "ashby",
    authParams,
    {}
  );
  console.log(result);
}

runTest().catch(console.error);
