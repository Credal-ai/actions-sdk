import { runAction } from "../../src/app.js";
import assert from "node:assert";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Test with token from: https://developers.google.com/oauthplayground/
// Scope required: https://www.googleapis.com/auth/spreadsheets
const authToken = process.env.GOOGLE_ACTIONS_ACCESS_TOKEN;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const sheetName = process.env.GOOGLE_SHEET_NAME ?? "Connectors";

if (!authToken || !spreadsheetId) {
  console.error("Missing GOOGLE_ACTIONS_ACCESS_TOKEN or GOOGLE_SPREADSHEET_ID in .env");
  process.exit(1);
}

/** Returns the last N rows of a sheet for read-back verification. */
async function readLastNRows(n: number): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`;
  const resp = await axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } });
  const allValues: string[][] = resp.data.values ?? [];
  return allValues.slice(-n);
}

async function test_appendSingleRow() {
  console.log("\n[TEST] Append single row");
  const row = ["TestAppend-Single", "single@example.com", "555-0010"];

  const result = await runAction("appendRowsToSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    rows: [row],
  });

  assert(result.success, `Expected success, got: ${result.error}`);
  assert(result.spreadsheetUrl?.includes(spreadsheetId), "spreadsheetUrl should contain the spreadsheet ID");

  const lastRows = await readLastNRows(1);
  assert.deepEqual(lastRows[0], row, `Read-back mismatch. Expected ${JSON.stringify(row)}, got ${JSON.stringify(lastRows[0])}`);
  console.log("  PASS — row appended and verified");
}

async function test_appendMultipleRows() {
  console.log("\n[TEST] Append multiple rows");
  const rows = [
    ["TestAppend-Multi-1", "multi1@example.com", "555-0011"],
    ["TestAppend-Multi-2", "multi2@example.com", "555-0012"],
    ["TestAppend-Multi-3", "multi3@example.com", "555-0013"],
  ];

  const result = await runAction("appendRowsToSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    rows,
  });

  assert(result.success, `Expected success, got: ${result.error}`);

  const lastRows = await readLastNRows(3);
  assert.deepEqual(lastRows, rows, "Read-back mismatch for multi-row append");
  console.log("  PASS — 3 rows appended and verified");
}

/**
 * Regression test: ensure the old { stringValue: "..." } cell wrapper is no
 * longer required — plain string arrays should be accepted.
 */
async function test_plainStringCellsAccepted() {
  console.log("\n[TEST] Plain string cells accepted (regression: no {stringValue} wrapper needed)");
  const row = ["PlainString", "plain@example.com"];

  const result = await runAction("appendRowsToSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    rows: [row],
  });

  assert(result.success, `Expected success with plain string cells, got: ${result.error}`);

  const lastRows = await readLastNRows(1);
  assert.deepEqual(lastRows[0], row, "Read-back mismatch for plain string cells");
  console.log("  PASS — plain string cells work correctly");
}

async function test_emptyRowsReturnsFailure() {
  console.log("\n[TEST] Empty rows array should fail gracefully (API will reject)");
  // The Sheets API rejects an empty values array; the action should surface this as success:false
  const result = await runAction("appendRowsToSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    rows: [],
  });
  // Either the action rejects it (success: false) or the Zod schema rejects it —
  // either way it must not silently succeed with no data written.
  assert(!result.success, "Appending empty rows should not succeed silently");
  console.log("  PASS — empty rows correctly rejected");
}

async function runAll() {
  console.log("=== appendRowsToSpreadsheet tests ===");
  await test_appendSingleRow();
  await test_appendMultipleRows();
  await test_plainStringCellsAccepted();
  await test_emptyRowsReturnsFailure();
  console.log("\nAll tests passed.");
}

runAll().catch(error => {
  console.error("Test failed:", error.message ?? error);
  process.exit(1);
});
