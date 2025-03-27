import { randomInt } from "crypto";
import { runAction } from "../../src/app";
import { authParams } from "./common";

async function runTest() {
  const x = randomInt(100);
  await runAction("updateCandidate", "ashby", authParams, {
    candidateId: "842369a6-9a51-4119-8df6-03093b447836",
    name: "Test Name " + x,
    email: "test" + x + "@example.com",
    phoneNumber: "1234567890+" + x,
    linkedInUrl: "updated linkedInUrl " + x,
    githubUrl: "updated githubUrl " + x,
    websiteUrl: "updated websiteUrl " + x,
    alternateEmail: "alternate" + x + "@example.com",
    location: {
      city: "updated city " + x,
      region: "updated region " + x,
      country: "updated country " + x,
    },
    sendNotifications: true,
  });
}

runTest().catch(console.error);
