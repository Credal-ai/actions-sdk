import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { utils, write } from "xlsx";
import { getGoogleSheetContent, parseWorkbookBufferToPlainText } from "../../src/utils/google";

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("getGoogleSheetContent XLSX preferred path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createWorkbookBuffer = () => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["name", "value"], ["alpha", 1]]), "Summary");
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["city"], ["NYC"]]), "Locations");
    return Buffer.from(write(workbook, { bookType: "xlsx", type: "buffer" }));
  };

  it("prefers XLSX export and parses workbook with sheet names", async () => {
    const mockGet = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValueOnce({ data: createWorkbookBuffer() });

    const content = await getGoogleSheetContent("sheet-id", "token", { get: mockGet } as any, "");

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      expect.objectContaining({ responseType: "arraybuffer" }),
    );
    expect(content).toContain("--- Sheet: Summary ---");
    expect(content).toContain("--- Sheet: Locations ---");
  });

  it("falls back to CSV export if XLSX export fails", async () => {
    const mockGet = jest
      .fn<(...args: any[]) => Promise<any>>()
      .mockRejectedValueOnce(new Error("xlsx export failed"))
      .mockResolvedValueOnce({ data: "name,value\nalpha,1" });

    const content = await getGoogleSheetContent("sheet-id", "token", { get: mockGet } as any, "");

    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("mimeType=text/csv"),
      expect.objectContaining({ responseType: "text" }),
    );
    expect(JSON.parse(content)).toEqual([
      {
        sheetName: "Sheet1",
        headers: [
          { column: "A", header: "name" },
          { column: "B", header: "value" },
        ],
        rows: [
          { column: "A", row: 2, value: "alpha" },
          { column: "B", row: 2, value: "1" },
        ],
      },
    ]);
  });

  it("falls back to Sheets API if both exports fail", async () => {
    const mockGet = jest
      .fn<(...args: any[]) => Promise<any>>()
      .mockRejectedValueOnce(new Error("xlsx export failed"))
      .mockRejectedValueOnce(new Error("csv export failed"))
      .mockResolvedValueOnce({
        data: {
          sheets: [
            {
              properties: { title: "Summary" },
              data: [
                {
                  rowData: [
                    { values: [{ formattedValue: "name" }] },
                    { values: [{ formattedValue: "alpha" }] },
                  ],
                },
              ],
            },
          ],
        },
      });

    const content = await getGoogleSheetContent("sheet-id", "token", { get: mockGet } as any, "");

    expect(mockGet).toHaveBeenNthCalledWith(3, expect.stringContaining("includeGridData=true"), expect.any(Object));
    expect(JSON.parse(content)).toEqual([
      {
        sheetName: "Summary",
        headers: [{ column: "A", header: "name" }],
        rows: [{ column: "A", row: 2, value: "alpha" }],
      },
    ]);
  });
});

describe("parseWorkbookBufferToPlainText", () => {
  it("preserves multi-sheet workbook parsing for Excel files", () => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["h1"], ["v1"]]), "SheetA");
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["h2"], ["v2"]]), "SheetB");

    const workbookBuffer = Buffer.from(write(workbook, { bookType: "xlsx", type: "buffer" }));
    const content = parseWorkbookBufferToPlainText(workbookBuffer);

    expect(content).toContain("--- Sheet: SheetA ---");
    expect(content).toContain("--- Sheet: SheetB ---");
  });
});
