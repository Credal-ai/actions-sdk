import { runAction } from "../../src/app";
import { authParams } from "./common";

async function runTest() {
  await runAction("addCandidateToProject", "ashby", authParams, {
    candidateId: "842369a6-9a51-4119-8df6-03093b447836", // Test Name 41
    projectId: "12aea2c5-e99b-4555-9e15-7339e5a0421b",
  });
}

runTest().catch(console.error);
