import type {
  googleOauthScheduleCalendarMeetingOutputType,
  googleOauthScheduleCalendarMeetingParamsType,
} from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";

/**
 * Test for the Google OAuth scheduleCalendarMeeting action
 */
async function runTest() {
  console.log("Running test for Google OAuth scheduleCalendarMeeting");
  // Test with token from: https://developers.google.com/oauthplayground/
  const authToken = "insert-access-token";
  const calendarId = "insert-calendar-id";

  // Test 1: One-time meeting with timezone
  console.log("\n=== Test 1: One-time meeting with timezone ===");
  const oneTimeResult: googleOauthScheduleCalendarMeetingOutputType =
    await runAction(
      "scheduleCalendarMeeting",
      "googleOauth",
      {
        authToken,
      },
      {
        calendarId,
        name: "Credal Test Meeting (One-time)",
        start: new Date().toISOString(),
        end: new Date(new Date().getTime() + 1000 * 60 * 60).toISOString(),
        description:
          "This is a one-time test meeting created automatically by the actions-sdk test suite.",
        attendees: ["test@test.com", "test2@test.com"],
        useGoogleMeet: true,
        timeZone: "America/New_York",
      } as googleOauthScheduleCalendarMeetingParamsType
    );

  console.log("One-time meeting result:", oneTimeResult);

  // Validate the result
  assert(oneTimeResult.success, "One-time meeting should be successful");
  assert(oneTimeResult.eventId, "One-time meeting should contain an eventId");

  console.log(
    "Link to One-time Google Calendar Event: ",
    oneTimeResult.eventUrl
  );

  // Test 2: Weekly recurring meeting
  console.log("\n=== Test 2: Weekly recurring meeting ===");
  const weeklyRecurringResult: googleOauthScheduleCalendarMeetingOutputType =
    await runAction(
      "scheduleCalendarMeeting",
      "googleOauth",
      {
        authToken,
      },
      {
        calendarId,
        name: "Credal Weekly Team Meeting",
        start: new Date().toISOString(),
        end: new Date(new Date().getTime() + 1000 * 60 * 60).toISOString(),
        description:
          "This is a weekly recurring test meeting created automatically by the actions-sdk test suite.",
        attendees: ["test@test.com"],
        useGoogleMeet: true,
        recurrence: {
          frequency: "WEEKLY",
          interval: 1,
          count: 10, // 10 occurrences
          byDay: ["MO", "WE", "FR"],
        },
      } as googleOauthScheduleCalendarMeetingParamsType
    );

  console.log("Weekly recurring meeting result:", weeklyRecurringResult);

  // Validate the result
  assert(
    weeklyRecurringResult.success,
    "Weekly recurring meeting should be successful"
  );
  assert(
    weeklyRecurringResult.eventId,
    "Weekly recurring meeting should contain an eventId"
  );

  console.log(
    "Link to Weekly Recurring Google Calendar Event: ",
    weeklyRecurringResult.eventUrl
  );

  // Test 3: Daily recurring meeting with end date
  console.log("\n=== Test 3: Daily recurring meeting with end date ===");
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // 30 days from now

  const dailyRecurringResult: googleOauthScheduleCalendarMeetingOutputType =
    await runAction(
      "scheduleCalendarMeeting",
      "googleOauth",
      {
        authToken,
      },
      {
        calendarId,
        name: "Credal Daily Standup",
        start: new Date().toISOString(),
        end: new Date(new Date().getTime() + 1000 * 60 * 30).toISOString(), // 30 minute meeting
        description:
          "This is a daily recurring standup meeting created automatically by the actions-sdk test suite.",
        attendees: ["test@test.com"],
        recurrence: {
          frequency: "DAILY",
          interval: 1,
          until: endDate.toISOString(),
        },
      } as googleOauthScheduleCalendarMeetingParamsType
    );

  console.log("Daily recurring meeting result:", dailyRecurringResult);

  // Validate the result
  assert(
    dailyRecurringResult.success,
    "Daily recurring meeting should be successful"
  );
  assert(
    dailyRecurringResult.eventId,
    "Daily recurring meeting should contain an eventId"
  );

  console.log(
    "Link to Daily Recurring Google Calendar Event: ",
    dailyRecurringResult.eventUrl
  );

  // Test 4: Monthly recurring meeting on specific day of month
  console.log("\n=== Test 4: Monthly recurring meeting ===");
  const monthlyRecurringResult: googleOauthScheduleCalendarMeetingOutputType =
    await runAction(
      "scheduleCalendarMeeting",
      "googleOauth",
      {
        authToken,
      },
      {
        calendarId,
        name: "Credal Monthly All-Hands",
        start: new Date().toISOString(),
        end: new Date(new Date().getTime() + 1000 * 60 * 90).toISOString(), // 90 minute meeting
        description:
          "This is a monthly recurring all-hands meeting created automatically by the actions-sdk test suite.",
        attendees: ["test@test.com", "test2@test.com"],
        useGoogleMeet: true,
        recurrence: {
          frequency: "MONTHLY",
          interval: 1,
          count: 12, // 12 months
          byMonthDay: [15], // 15th of each month
        },
      } as googleOauthScheduleCalendarMeetingParamsType
    );

  console.log("Monthly recurring meeting result:", monthlyRecurringResult);

  // Validate the result
  assert(
    monthlyRecurringResult.success,
    "Monthly recurring meeting should be successful"
  );
  assert(
    monthlyRecurringResult.eventId,
    "Monthly recurring meeting should contain an eventId"
  );

  console.log(
    "Link to Monthly Recurring Google Calendar Event: ",
    monthlyRecurringResult.eventUrl
  );

  return {
    oneTime: oneTimeResult,
    weeklyRecurring: weeklyRecurringResult,
    dailyRecurring: dailyRecurringResult,
    monthlyRecurring: monthlyRecurringResult,
  };
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
