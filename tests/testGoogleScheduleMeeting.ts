import {
  googleOauthScheduleCalendarMeetingOutputType,
  googleOauthScheduleCalendarMeetingParamsType,
} from "../src/actions/autogen/types";
import { runAction } from "../src/app";
import assert from "node:assert";

/**
 * Test for the Google OAuth scheduleCalendarMeeting action
 */
async function runTest() {
  console.log("Running test for Google OAuth scheduleCalendarMeeting");
  // Test with token from: https://developers.google.com/oauthplayground/
  const authToken = "insert-access-token";
  const calendarId = "insert-calendar-id";

  const result: googleOauthScheduleCalendarMeetingOutputType = await runAction(
    "scheduleCalendarMeeting",
    "googleOauth",
    {
      authToken,
    },
    {
      calendarId,
      name: "Credal Test Meeting",
      start: new Date().toISOString(),
      end: new Date(new Date().getTime() + 1000 * 60 * 60).toISOString(),
      description:
        "This is a test meeting created automatically by the actions-sdk test suite.",
      attendees: ["test@test.com", "test2@test.com"],
      useGoogleMeet: true,
    } as googleOauthScheduleCalendarMeetingParamsType
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.eventId, "Result should be successful");
  assert(result.success, "Result should contain an eventId");

  console.log("Link to Google Calendar Event: ", result.eventUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
