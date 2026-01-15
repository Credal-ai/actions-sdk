import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";

dotenv.config();

const authToken = process.env.GOOGLE_ACTIONS_ACCESS_TOKEN;
const spreadsheetId = "1ig4zHxFgbwQRdAMIeFBw4f3dB3ihtqLDgj06fzdiKrQ";
const sheetId = 0;

/**
 * Test for the Google OAuth deleteRowFromSpreadsheet action
 */
async function runTest() {
  console.log("Running test for Google OAuth deleteRowFromSpreadsheet action");

  const result = await runAction(
    "deleteRowFromSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetId,
      rowIndex: 1,
    },
  );

  console.log("Result:", result);
  assert(result.success, "Delete row should succeed");
  console.log("Spreadsheet URL:", result.spreadsheetUrl);

  await runDeleteMultipleRowsTest();

  return result;
}

async function runDeleteMultipleRowsTest() {
  console.log("Running test for deleting multiple rows sequentially");

  const result1 = await runAction(
    "deleteRowFromSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetId,
      rowIndex: 2,
    },
  );

  console.log("First delete result:", result1);
  assert(result1.success, "First delete should succeed");

  const result2 = await runAction(
    "deleteRowFromSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      sheetId,
      rowIndex: 2,
    },
  );

  console.log("Second delete result:", result2);
  assert(result2.success, "Second delete should succeed");

  return result2;
}

runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
