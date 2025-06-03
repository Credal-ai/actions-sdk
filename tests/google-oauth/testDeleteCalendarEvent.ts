import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "deleteCalendarEvent",
    "googleOauth",
    { authToken: "auth-token-with-calendar-scope-here" },
    {
      calendarId: "primary",
      eventId: "event-id-here",
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  console.log("Successfully deleted event");
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
