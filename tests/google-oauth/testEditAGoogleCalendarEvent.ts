import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const result = await runAction(
    "editAGoogleCalendarEvent",
    "googleOauth",
    { authToken: process.env.GOOGLE_OAUTH_EDIT_EVENT_SCOPE },
    {
      calendarId: "primary",
      eventId: "19ta0khreli30ib22n2c2717vd",
      title: "Edited Event Title",
      description: "Edited event description",
      start: new Date(Date.now() + 3600 * 1000).toISOString(),
      end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      location: "Conference Room A",
      attendees: ["colleague@example.com", "manager@example.com"],
      status: "confirmed",
      timeZone: "Europe/London",
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(
    typeof result.eventId === "string" && result.eventId.length > 0,
    "Should return eventId",
  );
  assert(
    typeof result.eventUrl === "string" && result.eventUrl.length > 0,
    "Should return eventUrl",
  );
  assert(
    typeof result.eventDayOfWeek === "string",
    "Should return eventDayOfWeek",
  );
  console.log(`Successfully edited event: ${result.eventId}`);
  console.log("Event Day of Week: ", result.eventDayOfWeek);
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
