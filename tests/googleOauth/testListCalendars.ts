import assert from "node:assert";
import { runAction } from "../../src/app";

async function runTest() {
  const result = await runAction(
    "listCalendars",
    "googleOauth",
    // Replace with a valid OAuth token for testing
    { authToken: "auth-token-here" },
    {
      // Optional: pageToken and maxResults can be provided here if needed
    },
  );

  assert(result, "Response should not be null");
  assert(result.success, "Success should be true");
  assert(Array.isArray(result.calendars), "Calendars should be an array");
  if (result.calendars.length > 0) {
    assert(result.calendars[0].id, "Calendar should have an id");
    assert(result.calendars[0].summary, "Calendar should have a summary");
  }
  console.log(`Successfully listed ${result.calendars.length} calendars`);
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  if (error.response) {
    console.error("API response:", error.response.data);
    console.error("Status code:", error.response.status);
  }
  process.exit(1);
});