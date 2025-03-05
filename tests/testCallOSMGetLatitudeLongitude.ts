import { runAction } from "../src/app";

async function runTest() {
  const result = await runAction(
    "getLatitudeLongitudeFromLocation",
    "openstreetmap",
    {}, // authParams
    { location: "Lower East Side" }
  );
  console.log(result);
}

runTest().catch(console.error);
