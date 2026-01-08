import { runAction } from "../../src/app.js";
import assert from "node:assert";

// Test with token from: https://developers.google.com/oauthplayground/
const authToken = "insert-access-token";
const spreadsheetId = "insert-spreadsheet-id";
const sheetName = "Sheet1";

/**
 * Test for the Google OAuth appendRowsToSpreadsheet action
 */
async function runTest() {
  console.log("Running test for Google OAuth appendRowsToSpreadsheet action");

  // Test appending a single row
  const result = await runAction(
    "appendRowsToSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetName,
      rows: [
        [{ stringValue: "Name" }, { stringValue: "Email" }, { stringValue: "Phone" }],
      ],
    },
  );

  console.log("Result:", result);
  assert(result.success, "Append rows should succeed");
  console.log("Spreadsheet URL:", result.spreadsheetUrl);

  // Test appending multiple rows
  await runAppendMultipleRowsTest();

  return result;
}

async function runAppendMultipleRowsTest() {
  console.log("Running test for appending multiple rows");

  const result = await runAction(
    "appendRowsToSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetName: "Sheet1",
      rows: [
        [{ stringValue: "John Doe" }, { stringValue: "john@example.com" }, { stringValue: "555-1234" }],
        [{ stringValue: "Jane Smith" }, { stringValue: "jane@example.com" }, { stringValue: "555-5678" }],
        [{ stringValue: "Bob Wilson" }, { stringValue: "bob@example.com" }, { stringValue: "555-9012" }],
      ],
    },
  );

  console.log("Multiple rows append result:", result);
  assert(result.success, "Append multiple rows should succeed");
  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});

