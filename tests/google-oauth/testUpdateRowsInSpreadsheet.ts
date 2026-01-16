import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

// Test with token from: https://developers.google.com/oauthplayground/
const authToken = process.env.GOOGLE_ACTIONS_ACCESS_TOKEN;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const sheetName = "Sheet1";

/**
 * Test for the Google OAuth updateRowsInSpreadsheet action
 */
async function runTest() {
  console.log("Running test for Google OAuth updateRowsInSpreadsheet action");

  // Test updating a single row
  const result = await runAction(
    "updateRowsInSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetName,
      startRow: 2,
      rows: [
        [{ stringValue: "Updated Name" }, { stringValue: "updated@example.com" }, { stringValue: "555-0000" }],
      ],
    },
  );

  console.log("Result:", result);
  assert(result.success, "Update single row should succeed");
  console.log("Spreadsheet URL:", result.spreadsheetUrl);
  console.log("Updated range:", result.updatedRange);
  console.log("Updated rows:", result.updatedRows);
  console.log("Updated cells:", result.updatedCells);

  // Test updating multiple rows
  await runUpdateMultipleRowsTest();

  return result;
}

async function runUpdateMultipleRowsTest() {
  console.log("Running test for updating multiple rows");

  const result = await runAction(
    "updateRowsInSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetName: "Sheet1",
      startRow: 3,
      rows: [
        [{ stringValue: "John Doe" }, { stringValue: "john@example.com" }, { stringValue: "555-1234" }],
        [{ stringValue: "Jane Smith" }, { stringValue: "jane@example.com" }, { stringValue: "555-5678" }],
        [{ stringValue: "Bob Wilson" }, { stringValue: "bob@example.com" }, { stringValue: "555-9012" }],
      ],
    },
  );

  console.log("Multiple rows update result:", result);
  assert(result.success, "Update multiple rows should succeed");
  console.log("Updated range:", result.updatedRange);
  console.log("Updated rows:", result.updatedRows);
  console.log("Updated cells:", result.updatedCells);
  return result;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
