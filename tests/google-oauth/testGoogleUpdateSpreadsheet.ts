import { runAction } from "../../src/app";
import assert from "node:assert";

// Test with token from: https://developers.google.com/oauthplayground/
const authToken = "insert-access-token";
const spreadsheetId = "insert-spreadsheet-id";

/**
 * Test for the Google OAuth updateSpreadsheet action
 */
async function runTest() {
  console.log("Running test for Google OAuth updateSpreadsheet action");

  const result = await runAction(
    "updateSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      requests: [
        {
          addSheet: {
            properties: {
              title: "Test Sheet",
              gridProperties: {
                rowCount: 20,
                columnCount: 12,
              },
            },
          },
        },
      ],
    },
  );

  console.log("Result:", result);
  assert(result.success, "Sheet creation should succeed");

  console.log("Spreadsheet URL:", result.spreadsheetUrl);

  const newSheetId = result.replies[0].addSheet.properties.sheetId;

  await runUpdateSheetPropertiesTest(newSheetId);
  await runUpdateSpreadsheetPropertiesTest();
  await runUpdateCellsTest(newSheetId);
  await runDeleteSheetTest(newSheetId);

  return result;
}

async function runUpdateSheetPropertiesTest(sheetId: string) {
  console.log("Running test for Google OAuth updateSheetProperties");

  const result = await runAction(
    "updateSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: parseInt(sheetId),
              title: "Updated Test Sheet",
              gridProperties: {
                rowCount: 30,
                columnCount: 15,
              },
            },
            fields: "title,gridProperties.rowCount,gridProperties.columnCount",
          },
        },
      ],
    },
  );

  console.log("Sheet properties update result:", result);
  assert(result.success, "Sheet properties update should succeed");
  return sheetId;
}

async function runUpdateSpreadsheetPropertiesTest() {
  console.log("Running test for Google OAuth updateSpreadsheetProperties");

  const result = await runAction(
    "updateSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      requests: [
        {
          updateSpreadsheetProperties: {
            properties: {
              title: "Updated Test Spreadsheet",
              locale: "en_US",
              timeZone: "America/New_York",
              autoRecalc: "ON_CHANGE",
            },
            fields: "title,locale,timeZone,autoRecalc",
          },
        },
      ],
    },
  );

  console.log("Spreadsheet properties update result:", result);
  assert(result.success, "Spreadsheet properties update should succeed");
  return spreadsheetId;
}

async function runUpdateCellsTest(sheetId: string) {
  console.log("Running test for Google OAuth updateCells");

  const result = await runAction(
    "updateSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      requests: [
        {
          updateCells: {
            range: {
              sheetId: parseInt(sheetId),
              startRowIndex: 0,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 2,
            },
            rows: [
              {
                values: [
                  {
                    userEnteredValue: { stringValue: "Header 1" },
                  },
                  {
                    userEnteredValue: { stringValue: "Header 2" },
                  },
                ],
              },
              {
                values: [
                  {
                    userEnteredValue: { numberValue: 100 },
                  },
                  {
                    userEnteredValue: { numberValue: 200 },
                  },
                ],
              },
            ],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  );

  console.log("Cells update result:", result);
  assert(result.success, "Cells update should succeed");
  return sheetId;
}

async function runDeleteSheetTest(sheetId: string) {
  console.log("Running test for Google OAuth deleteSheet");

  const result = await runAction(
    "updateSpreadsheet",
    "googleOauth",
    {
      authToken,
    },
    {
      spreadsheetId,
      requests: [
        {
          deleteSheet: {
            sheetId: parseInt(sheetId),
          },
        },
      ],
    },
  );

  console.log("Sheet deletion result:", result);
  assert(result.success, "Sheet deletion should succeed");
  return;
}

// Run the test
runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
