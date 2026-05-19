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

// Use high row numbers so tests don't clobber real data
const TEST_ROW_BASE = 200;

if (!authToken || !spreadsheetId) {
  console.error("Missing GOOGLE_ACTIONS_ACCESS_TOKEN or GOOGLE_SPREADSHEET_ID in .env");
  process.exit(1);
}

/** Read values back from the sheet to verify writes actually landed. */
async function readRange(range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const resp = await axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } });
  return resp.data.values ?? [];
}

async function test_basicSingleRowUpdate() {
  console.log("\n[TEST] Basic single-row update (number startRow)");
  const testRow = TEST_ROW_BASE;
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    startRow: testRow,
    rows: [["Alice", "alice@example.com", "555-0001"]],
  });

  assert(result.success, `Expected success, got: ${result.error}`);
  assert.equal(result.updatedRows, 1, "updatedRows should be 1");
  assert.equal(result.updatedColumns, 3, "updatedColumns should be 3");
  assert.equal(result.updatedCells, 3, "updatedCells should be 3");
  assert(result.updatedRange?.includes(`A${testRow}`), `updatedRange should reference A${testRow}, got: ${result.updatedRange}`);

  const written = await readRange(`${sheetName}!A${testRow}:C${testRow}`);
  assert.deepEqual(written[0], ["Alice", "alice@example.com", "555-0001"], "Read-back data mismatch");
  console.log("  PASS — updatedRange:", result.updatedRange);
}

/**
 * Core regression test: LLMs emit numbers as JSON strings.
 * The fix (z.coerce.number) must accept "201" and coerce it to 201.
 */
async function test_stringStartRowCoercion() {
  console.log("\n[TEST] String startRow coercion ('201' should be accepted as 201)");
  const testRow = TEST_ROW_BASE + 1;
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    startRow: String(testRow) as unknown as number, // simulate LLM passing a string
    rows: [["Coerced", "coerced@example.com", "555-0002"]],
  });

  assert(result.success, `Expected success with string startRow, got: ${result.error}`);
  assert.equal(result.updatedRows, 1, "updatedRows should be 1");

  const written = await readRange(`${sheetName}!A${testRow}:C${testRow}`);
  assert.deepEqual(written[0], ["Coerced", "coerced@example.com", "555-0002"], "Read-back data mismatch");
  console.log("  PASS — string startRow was correctly coerced");
}

async function test_multipleRowUpdate() {
  console.log("\n[TEST] Multi-row update");
  const testRow = TEST_ROW_BASE + 2;
  const rows = [
    ["John Doe", "john@example.com", "555-1234"],
    ["Jane Smith", "jane@example.com", "555-5678"],
    ["Bob Wilson", "bob@example.com", "555-9012"],
  ];
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    startRow: testRow,
    rows,
  });

  assert(result.success, `Expected success, got: ${result.error}`);
  assert.equal(result.updatedRows, 3, "updatedRows should be 3");
  assert.equal(result.updatedCells, 9, "updatedCells should be 9");

  const written = await readRange(`${sheetName}!A${testRow}:C${testRow + 2}`);
  assert.deepEqual(written, rows, "Read-back data mismatch");
  console.log("  PASS — updatedRange:", result.updatedRange);
}

async function test_startColumnNonDefault() {
  console.log("\n[TEST] startColumn — write starting at column C");
  const testRow = TEST_ROW_BASE + 5;
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    startRow: testRow,
    startColumn: "C",
    rows: [["ColC-value", "ColD-value"]],
  });

  assert(result.success, `Expected success, got: ${result.error}`);
  assert(result.updatedRange?.includes(`C${testRow}`), `updatedRange should reference C${testRow}, got: ${result.updatedRange}`);

  const written = await readRange(`${sheetName}!C${testRow}:D${testRow}`);
  assert.deepEqual(written[0], ["ColC-value", "ColD-value"], "Read-back data mismatch for startColumn");
  console.log("  PASS — updatedRange:", result.updatedRange);
}

async function test_sheetNameWithSpaces() {
  console.log("\n[TEST] Sheet name with spaces ('Goal tracking')");
  const testRow = TEST_ROW_BASE;
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName: "Goal tracking",
    startRow: testRow,
    rows: [["SpaceTest", "space@example.com"]],
  });

  assert(result.success, `Expected success with spaced sheet name, got: ${result.error}`);
  console.log("  PASS — updatedRange:", result.updatedRange);
}

async function test_invalidStartRow_throws() {
  console.log("\n[TEST] startRow < 1 should return failure");
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    startRow: 0,
    rows: [["Bad"]],
  });
  // The action catches and returns success: false rather than throwing to the caller
  assert(!result.success, "Expected failure for startRow < 1");
  console.log("  PASS — correctly rejected startRow 0");
}

async function test_invalidStartColumn_throws() {
  console.log("\n[TEST] Non-letter startColumn should return failure");
  const result = await runAction("updateRowsInSpreadsheet", "googleOauth", { authToken }, {
    spreadsheetId,
    sheetName,
    startRow: TEST_ROW_BASE,
    startColumn: "1A", // invalid
    rows: [["Bad"]],
  });
  assert(!result.success, "Expected failure for invalid startColumn");
  console.log("  PASS — correctly rejected startColumn '1A'");
}

async function runAll() {
  console.log("=== updateRowsInSpreadsheet tests ===");
  await test_basicSingleRowUpdate();
  await test_stringStartRowCoercion();
  await test_multipleRowUpdate();
  await test_startColumnNonDefault();
  await test_sheetNameWithSpaces();
  await test_invalidStartRow_throws();
  await test_invalidStartColumn_throws();
  console.log("\nAll tests passed.");
}

runAll().catch(error => {
  console.error("Test failed:", error.message ?? error);
  process.exit(1);
});
