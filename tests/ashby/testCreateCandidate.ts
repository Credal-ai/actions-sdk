import { runAction } from "../../src/app";
import { authParams } from "./common";

async function runTest() {
  await runAction("createCandidate", "ashby", authParams, {
    name: "Test User",
    email: "test@user.com",
    phoneNumber: "1234567890",
    source: "Test Source",
    location: {
      city: "Test City",
      region: "Test Region",
      country: "Test Country",
    },
  });
}

runTest().catch(console.error);
