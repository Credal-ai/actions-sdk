import assert from "node:assert";
import { runAction } from "../../src/app";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const result = await runAction(
    "moveCalendarEvent",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_TOKEN },
    {
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      eventId: process.env.GOOGLE_EVENT_ID,
      destination: process.env.GOOGLE_CALENDAR_DESTINATION_ID,
    },
  );

  console.log("Response: ", result);
  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(typeof result.eventId === "string" && result.eventId.length > 0, "Should return eventId");
  assert(typeof result.eventUrl === "string" && result.eventUrl.length > 0, "Should return eventUrl");
  console.log(`Successfully moved event: ${result.eventId}`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});
