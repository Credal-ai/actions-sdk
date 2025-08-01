import { runAction } from "../../src/app.js";
import { authParams } from "./common";

async function runTest() {
  const result = await runAction("getCandidateInfo", "ashby", authParams, {
    candidateId: "90909014-d41c-4d56-a581-7b10ac6997a9", // B Test
  });
  console.log(result);
}

runTest().catch(console.error);
