import { runAction } from "../src/app";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "getLatitudeLongitudeFromLocation",
    "openstreetmap",
    {}, // authParams
    { location: "Lower East Side" }
  );
  console.log(result);
  assert(result.length > 0, "Result should not be empty");
}

runTest().catch(console.error);
