import { runAction } from "../../src/app";

async function runTest() {
  await runAction(
    "createNote",
    "ashby",
    { authToken: "insert-during-testing" },
    {
      candidateId: "90909014-d41c-4d56-a581-7b10ac6997a9", // B Test
      note: "This is a test note",
    }
  );
}

runTest().catch(console.error);
