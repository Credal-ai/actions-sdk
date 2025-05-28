import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Running basic test");
  const result = await runAction(
    "getGongTranscripts",
    "gong",
    {
      authToken: process.env.GONG_TOKEN!,
      username: process.env.GONG_USERNAME!,
    },
    {
      userRole: "Chief of Staff",
      trackers: ["Value Prop"],
      startDate: "2025-05-01T00:00:00Z",
      endDate: "2025-05-13T23:59:59Z"
    }
  );

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.callTranscripts), "Response should contain callTranscripts array");
  
  if (result.callTranscripts.length > 0) {
    const firstTranscript = result.callTranscripts[0];
    assert(firstTranscript.callId, "Transcript should have a callId");
    assert(firstTranscript.callName, "Transcript should have a callName");
    assert(firstTranscript.startTime, "Transcript should have a startTime");
    assert(firstTranscript, "Transcript should have transcript data");
    assert(firstTranscript.transcript[0].speakerName, "Transcript should have speaker names");
    assert(firstTranscript.transcript[0].speakerEmail, "Transcript should have speaker emails");
    assert(firstTranscript.transcript[0].speakerEmail != "Unknown", "Speaker email should not be 'Unknown'");
    assert(Array.isArray(firstTranscript.transcript[0].sentences), "Transcript should have sentences array");
  }

  console.log("Test passed successfully!");
}

async function runTestInvalidUsername() {
  console.log("Running test with invalid username");
  const result = await runAction(
    "getGongTranscripts",
    "gong",
    {
      authToken: process.env.GONG_TOKEN!,
      username: process.env.BAD_GONG_USERNAME!,
    },
    {
      userRole: "Chief of Staff",
      trackers: ["Value Prop"],
      startDate: "2025-05-01T00:00:00Z",
      endDate: "2025-05-08T23:59:59Z"
    }
  );

  // Validate response
  assert(result.error, "Response should indicate an error");
  assert(result.error === "User email not found in Gong users", "Error message should indicate user not found");

  console.log("Test passed successfully!");
}

async function runTestInvalidUserRole() {
  console.log("Running test with invalid user role");
  const result = await runAction(
    "getGongTranscripts",
    "gong",
    {
      authToken: process.env.GONG_TOKEN!,
      username: process.env.GONG_USERNAME!,
    },
    {
      userRole: "Nonexistent Role",
      trackers: ["Value Prop"],
      startDate: "2025-05-01T00:00:00Z",
      endDate: "2025-05-13T23:59:59Z"
    }
  );
  assert(result.error, "Response should indicate an error");
  console.log("Test passed successfully!");
}

async function runTestInvalidTracker() {
  console.log("Running test with invalid tracker");
  const result = await runAction(
    "getGongTranscripts",
    "gong",
    {
      authToken: process.env.GONG_TOKEN!,
      username: process.env.GONG_USERNAME!,
    },
    {
      userRole: "Chief of Staff",
      trackers: ["Fake Tracker"],
      startDate: "2025-05-01T00:00:00Z",
      endDate: "2025-05-13T23:59:59Z"
    }
  );
  assert(result.success, "Response should indicate success");
  assert(result.callTranscripts.length == 0, "Response should contain empty callTranscripts array");
  console.log("Test passed successfully!");
}

async function runTestNoTracker() {
  console.log("Running test with no tracker");
  const result = await runAction(
    "getGongTranscripts",
    "gong",
    {
      authToken: process.env.GONG_TOKEN!,
      username: process.env.GONG_USERNAME!,
    },
    {
      userRole: "Chief of Staff",
      trackers: [],
      startDate: "2025-05-01T00:00:00Z",
      endDate: "2025-05-13T23:59:59Z"
    });
  assert(result.success, "Response should indicate success");
  assert(result.callTranscripts.length > 0, "Response should contain callTranscripts array");
  assert(result.callTranscripts[0].callId, "Transcript should have a callId");
  assert(result.callTranscripts[0].callName, "Transcript should have a callName");
  assert(result.callTranscripts[0].startTime, "Transcript should have a startTime");
  console.log("Test passed successfully!");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
}); 

runTestInvalidUsername().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});

runTestInvalidUserRole().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});

runTestInvalidTracker().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});

runTestNoTracker().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
}
);
