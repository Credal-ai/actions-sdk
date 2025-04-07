import { googleOauthCreateSpreadsheetParamsType } from "../src/actions/autogen/types";
import { runAction } from "../src/app";
import assert from "node:assert";

/**
 * Test for the Google OAuth createSpreadsheet action
 */
async function runTest() {
  console.log("Running test for Google OAuth createSpreadsheet");

  const authToken = "insert-access-token"; // Test with token from: https://developers.google.com/oauthplayground/

  // Create a new spreadsheet with two sheets
  const result = await runAction(
    "createSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      title: "Test Spreadsheet",
      sheets: [
        {
          title: "Data",
          gridProperties: {
            rowCount: 100,
            columnCount: 26,
            frozenRowCount: 1,
          },
        },
        {
          title: "Summary",
          gridProperties: {
            rowCount: 50,
            columnCount: 10,
          },
        },
      ],
      properties: {
        locale: "en_US",
        timeZone: "America/New_York",
        autoRecalc: "ON_CHANGE",
      },
    } as googleOauthCreateSpreadsheetParamsType,
  );

  console.log("Result:", result);

  // Validate the result
  assert(result.spreadsheetId, "Result should contain a spreadsheetId");
  assert(result.spreadsheetUrl, "Result should contain a spreadsheetUrl");
  assert(result.sheets.length === 2, "Should have created 2 sheets");
  assert(
    result.sheets[0].title === "Data",
    "First sheet should be named 'Data'",
  );
  assert(
    result.sheets[1].title === "Summary",
    "Second sheet should be named 'Summary'",
  );

  console.log("Link to Google Spreadsheet: ", result.spreadsheetUrl);

  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
