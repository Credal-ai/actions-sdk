import { runAction } from "../src/app";
import { assert } from "node:console";

async function runTest() {
  const result = await runAction(
    "getForecastForLocation",
    "nws",
    { userAgent: "insert-test-user-agent" }, // format is "(example.com, name@example.com)"
    { latitude: 40.712776, longitude: -74.005974, isoDate: "2025-03-06" }
  );
  console.log(result);
  assert(result.result !== undefined, "Result should not be undefined");
}

runTest().catch(console.error);

