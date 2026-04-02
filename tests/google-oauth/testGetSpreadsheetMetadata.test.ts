import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import getSpreadsheetMetadata from "../../src/actions/providers/google-oauth/getSpreadsheetMetadata";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockAxiosGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
  },
}));

describe("getSpreadsheetMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns spreadsheet id/title and sheet metadata", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        spreadsheetId: "spreadsheet-123",
        properties: { title: "Team Planning" },
        sheets: [{ properties: { sheetId: 0, title: "Summary", index: 0 } }],
      },
    });

    const result = await getSpreadsheetMetadata({
      params: { spreadsheetId: "spreadsheet-123" },
      authParams: { authToken: "token" },
    });

    expect(result.success).toBe(true);
    expect(result.spreadsheetId).toBe("spreadsheet-123");
    expect(result.spreadsheetTitle).toBe("Team Planning");
    expect(result.sheets).toEqual([{ sheetId: 0, title: "Summary", index: 0, gid: 0 }]);
  });
});
