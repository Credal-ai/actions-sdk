import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  const now = new Date();
  const weekBeg = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday 00:00
  weekBeg.setHours(0, 0, 0, 0);
  const weekEnd = new Date(+weekBeg + 7 * 864e5);

  const result = await runAction(
    "listCalendarEvents",
    "googleOauth",
    { authToken: process.env.GOOGLE_CAL_AUTH_TOKEN },
    {
      calendarId: "test@gmail.com",
      query: "",
      maxResults: 50,
      timeMin: weekBeg.toISOString(),
      timeMax: weekEnd.toISOString(),
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(Array.isArray(result.events), "Events should be an array");
  // Only check the first event for required fields
  const first = result.events[0];
  if (first) {
    assert(
      typeof first.id === "string" && first.id.length > 0,
      "Event should have an id",
    );
    assert(typeof first.title === "string", "Event should have a title");
    assert(typeof first.status === "string", "Event should have a status");
    assert(typeof first.url === "string", "Event should have a url");
    assert(typeof first.start === "string", "Event should have a start");
    assert(
      typeof first.startDayOfWeek === "string",
      "Event should have a startDayOfWeek",
    );
    assert(typeof first.end === "string", "Event should have an end");
    assert(
      typeof first.endDayOfWeek === "string",
      "Event should have an endDayOfWeek",
    );
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
