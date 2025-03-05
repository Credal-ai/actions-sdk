import { runAction } from "../src/app";

async function runTest() {
  const result = await runAction("getForecastForLocation", "nws", {}, { latitude: 40.712776, longitude: -74.005974, isoDate: "2025-03-06" });
  console.log(result);
}

runTest().catch(console.error);

