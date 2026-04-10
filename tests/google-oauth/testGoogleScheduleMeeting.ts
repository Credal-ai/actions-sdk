import type {
  googleOauthScheduleCalendarMeetingOutputType,
  googleOauthScheduleCalendarMeetingParamsType,
} from "../../src/actions/autogen/types.js";
import { runAction } from "../../src/app.js";
import assert from "node:assert";

// Test configuration
const authToken = "insert-access-token";
const calendarId = "insert-calendar-id";

/**
 * Test for basic Google OAuth scheduleCalendarMeeting action
 */
async function runBasicTest() {
  console.log("Running basic test for Google OAuth scheduleCalendarMeeting");
  // Test with token from: https://developers.google.com/oauthplayground/

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
      timeZone: "America/New_York",
    } as googleOauthScheduleCalendarMeetingParamsType,
  );

  console.log("Basic test result:", result);

  // Validate the result
  assert(result.eventId, "Result should be successful");
  assert(result.success, "Result should contain an eventId");
  assert(result.eventDayOfWeek, "Result should contain eventDayOfWeek");
  assert(
    typeof result.eventDayOfWeek === "string",
    "eventDayOfWeek should be a string",
  );

  console.log("Link to Google Calendar Event: ", result.eventUrl);
  console.log("Event Day of Week: ", result.eventDayOfWeek);

  return result;
}

/**
 * Test daily recurrence with interval
 */
async function testDailyRecurrence() {
  console.log("Testing daily recurrence...");

  const result: googleOauthScheduleCalendarMeetingOutputType = await runAction(
    "scheduleCalendarMeeting",
    "googleOauth",
    { authToken },
    {
      calendarId,
      name: "Daily Standup Meeting",
      start: new Date().toISOString(),
      end: new Date(new Date().getTime() + 1000 * 60 * 30).toISOString(), // 30 minutes
      description: "Daily recurring standup meeting",
      attendees: ["test@test.com"],
      useGoogleMeet: true,
      timeZone: "America/New_York",
      recurrence: {
        frequency: "DAILY",
        interval: 1,
        count: 10, // 10 occurrences
      },
    } as googleOauthScheduleCalendarMeetingParamsType,
  );

  console.log("Daily recurrence result:", result);
  assert(result.success, "Daily recurrence should be successful");
  assert(result.eventId, "Daily recurrence should return an eventId");

  return result;
}

/**
 * Test weekly recurrence with specific days
 */
async function testWeeklyRecurrence() {
  console.log("Testing weekly recurrence with specific days...");

  const result: googleOauthScheduleCalendarMeetingOutputType = await runAction(
    "scheduleCalendarMeeting",
    "googleOauth",
    { authToken },
    {
      calendarId,
      name: "Weekly Team Meeting",
      start: new Date().toISOString(),
      end: new Date(new Date().getTime() + 1000 * 60 * 60).toISOString(), // 1 hour
      description: "Weekly team meeting on Monday, Wednesday, Friday",
      attendees: ["test@test.com", "test2@test.com"],
      useGoogleMeet: true,
      timeZone: "America/New_York",
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        byDay: ["MO", "WE", "FR"],
        until: new Date(
          new Date().getTime() + 1000 * 60 * 60 * 24 * 90,
        ).toISOString(), // 90 days from now
      },
    } as googleOauthScheduleCalendarMeetingParamsType,
  );

  console.log("Weekly recurrence result:", result);
  assert(result.success, "Weekly recurrence should be successful");
  assert(result.eventId, "Weekly recurrence should return an eventId");

  return result;
}

/**
 * Test monthly recurrence with specific month day
 */
async function testMonthlyRecurrence() {
  console.log("Testing monthly recurrence with specific month day...");

  const result: googleOauthScheduleCalendarMeetingOutputType = await runAction(
    "scheduleCalendarMeeting",
    "googleOauth",
    { authToken },
    {
      calendarId,
      name: "Monthly Board Meeting",
      start: new Date().toISOString(),
      end: new Date(new Date().getTime() + 1000 * 60 * 90).toISOString(), // 1.5 hours
      description: "Monthly board meeting on the 15th of each month",
      attendees: ["board@test.com", "ceo@test.com"],
      useGoogleMeet: true,
      timeZone: "America/New_York",
      recurrence: {
        frequency: "MONTHLY",
        interval: 1,
        byMonthDay: [15], // 15th of each month
        count: 12, // 12 months
      },
    } as googleOauthScheduleCalendarMeetingParamsType,
  );

  console.log("Monthly recurrence result:", result);
  assert(result.success, "Monthly recurrence should be successful");
  assert(result.eventId, "Monthly recurrence should return an eventId");

  return result;
}

/**
 * Run all tests including basic and recurrence tests
 */
async function runAllTests() {
  console.log(
    "=== Running Google OAuth Schedule Meeting Tests (Basic + Recurrence) ===\n",
  );

  const tests = [
    { name: "Basic Meeting", test: runBasicTest },
    { name: "Daily Recurrence", test: testDailyRecurrence },
    { name: "Weekly Recurrence", test: testWeeklyRecurrence },
    { name: "Monthly Recurrence", test: testMonthlyRecurrence },
  ];

  const results: Array<{
    name: string;
    result?: googleOauthScheduleCalendarMeetingOutputType;
    error?: unknown;
    success: boolean;
  }> = [];

  for (const { name, test } of tests) {
    try {
      console.log(`\n--- ${name} ---`);
      const result = await test();
      results.push({ name, result, success: true });
      console.log(`✅ ${name} passed\n`);
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
      results.push({ name, error, success: false });
    }
  }

  console.log("\n=== Test Summary ===");
  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed < total) {
    console.log("\nFailed tests:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`- ${r.name}: ${r.error}`);
      });
  }

  return results;
}

runAllTests().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
