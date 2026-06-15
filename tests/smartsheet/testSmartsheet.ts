import assert from "node:assert";
import { runAction } from "../../src/app.js";
import dotenv from "dotenv";

dotenv.config();

// Full round trip: listSheets → getSheetRows → addRowToSheet → updateRow.
// Requires SMARTSHEET_API_KEY and SMARTSHEET_TEST_SHEET_NAME (a sheet the token can write to).
async function runTest() {
  const authParams = { apiKey: process.env.SMARTSHEET_API_KEY! };
  const sheetName = process.env.SMARTSHEET_TEST_SHEET_NAME!;

  const listResult = await runAction("listSheets", "smartsheet", authParams, {});
  assert(listResult.success, listResult.error || "listSheets did not succeed");
  assert(Array.isArray(listResult.sheets), "sheets should be an array");
  const sheet = listResult.sheets.find((s: { name: string }) => s.name === sheetName);
  assert(sheet, `Sheet "${sheetName}" not found among ${listResult.sheets.length} sheets`);

  const getResult = await runAction("getSheetRows", "smartsheet", authParams, { sheetId: sheet.id });
  assert(getResult.success, getResult.error || "getSheetRows did not succeed");
  assert(getResult.sheet, "sheet should be present in the response");
  assert(Array.isArray(getResult.sheet.columns) && getResult.sheet.columns.length > 0, "sheet should have columns");
  const firstColumnTitle = getResult.sheet.columns[0].title;
  assert(firstColumnTitle, "first column should have a title");

  const addResult = await runAction("addRowToSheet", "smartsheet", authParams, {
    sheetId: sheet.id,
    cells: { [firstColumnTitle]: `Test row ${new Date().toISOString()}` },
  });
  assert(addResult.success, addResult.error || "addRowToSheet did not succeed");
  assert(addResult.rowId, "addRowToSheet should return the new rowId");

  const updateResult = await runAction("updateRow", "smartsheet", authParams, {
    sheetId: sheet.id,
    rowId: addResult.rowId,
    cells: { [firstColumnTitle]: `Updated row ${new Date().toISOString()}` },
  });
  assert(updateResult.success, updateResult.error || "updateRow did not succeed");
  assert(updateResult.rowId === addResult.rowId, "updateRow should return the same rowId");

  const badColumnResult = await runAction("addRowToSheet", "smartsheet", authParams, {
    sheetId: sheet.id,
    cells: { "Nonexistent Column": "value" },
  });
  assert(!badColumnResult.success, "addRowToSheet with an unknown column title should fail");
  assert(
    badColumnResult.error?.includes("Valid column titles"),
    "Error for an unknown column title should list valid column titles",
  );

  console.log("All Smartsheet actions succeeded. Created and updated row:", addResult.rowId);
}

runTest().catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});
