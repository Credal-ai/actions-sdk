import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "updateCalendarEvent",
    "googleOauth",
    { authToken: "auth-token-with-calendar-scope-here" },
    {
      calendarId: "primary",
      eventId: "event-id-here", 
      updates: {
        title: "Updated Event Title",
        description: "Updated event description",
        start: new Date(Date.now() + 3600 * 1000).toISOString(),
        end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        location: "Virtual",
        attendees: ["test@example.com"],
      },
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(typeof result.eventId === "string" && result.eventId.length > 0, "Should return eventId");
  assert(typeof result.eventUrl === "string" && result.eventUrl.length > 0, "Should return eventUrl");
  console.log(`Successfully updated event: ${result.eventId}`);
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
