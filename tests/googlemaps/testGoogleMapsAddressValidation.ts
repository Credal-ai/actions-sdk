import { assert } from "node:console";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "validateAddress",
    "googlemaps",
    { apiKey: "insert-during-testing" }, // authParams
    {
      postalCode: "11201",
      regionCode: "USA",
      addressLines: ["147 Prince St, Brooklyn, NY 11201-3022"],
      addressType: "business",
    },
  );
  assert(result.valid === true);
}

runTest().catch(console.error);
