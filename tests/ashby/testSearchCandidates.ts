import { runAction } from "../../src/app.js";
import { authParams } from "./common";

async function runTest() {
  const result = await runAction("searchCandidates", "ashby", authParams, {
    name: "Test",
  });
  console.log("Success:", result.success);
  console.log("Results count:", result.results?.length || 0);
  if (result.results) {
    for (const candidate of result.results) {
      console.log(`- ${candidate.name} (URL: ${candidate.url})`);
    }
  }
  if (result.error) {
    console.log("Error:", result.error);
  }
}

runTest().catch(console.error);
