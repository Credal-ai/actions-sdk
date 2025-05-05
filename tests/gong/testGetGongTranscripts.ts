import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "getGongTranscripts",
    "gong",
    {
      authToken: process.env.GONG_TOKEN!,
    },
    {
      userRole: "Sales",
      trackers: ["Tracker1", "Tracker2"],
      startDate: "2022-07-01T02:00:00-05:00",
      endDate: "2022-07-31T02:00:00-05:00"
    }
  );

  // Validate response
  assert(result, "Response should not be null");
  assert(result.success, "Response should indicate success");
  assert(Array.isArray(result.transcripts), "Response should contain transcripts array");
  
  if (result.transcripts.length > 0) {
    const firstTranscript = result.transcripts[0];
    assert(firstTranscript.callId, "Transcript should have a callId");
    assert(firstTranscript, "Transcript should have transcript data");
    assert(firstTranscript.speakerNames, "Transcript should have speaker names");
    assert(firstTranscript.topic, "Transcript should have a topic");
    assert(Array.isArray(firstTranscript.sentences), "Transcript should have sentences array");
  }

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
