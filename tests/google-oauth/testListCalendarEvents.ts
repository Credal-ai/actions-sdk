import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "listCalendarEvents",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN },
    { 
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      query: "move", 
      maxResults: 3
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(Array.isArray(result.events), "Events should be an array");
  // Only check the first event for required fields
  const first = result.events[0];
  if (first) {
    assert(typeof first.id === "string" && first.id.length > 0, "Event should have an id");
    assert(typeof first.status === "string", "Event should have a status");
    assert(typeof first.url === "string", "Event should have a url");
    assert(typeof first.start === "string", "Event should have a start");
    assert(typeof first.end === "string", "Event should have an end");
  }

  console.log(`Successfully found ${result.events.length} events`);
  console.log("Response: ", result);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
