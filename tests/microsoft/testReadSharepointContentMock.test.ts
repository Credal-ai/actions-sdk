import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { utils as xlsxUtils, write as xlsxWrite } from "xlsx";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockPost = jest.fn<(...args: any[]) => Promise<any>>();
const mockExtractRawText =
  jest.fn<(...args: any[]) => Promise<{ value: string }>>();
const mockExtractTextFromPdf = jest.fn<(...args: any[]) => Promise<string>>();
const mockParseOfficeAsync = jest.fn<(...args: any[]) => Promise<string>>();

jest.mock("../../src/actions/util/axiosClient", () => {
  const actual = jest.requireActual(
    "../../src/actions/util/axiosClient",
  ) as object;
  return {
    ...actual,
    axiosClient: {
      get: (...args: any[]) => mockGet(...args),
      post: (...args: any[]) => mockPost(...args),
    },
  };
});

jest.mock("mammoth", () => ({
  __esModule: true,
  default: { extractRawText: (...args: any[]) => mockExtractRawText(...args) },
}));

jest.mock("../../src/utils/pdf", () => ({
  extractTextFromPdf: (...args: any[]) => mockExtractTextFromPdf(...args),
}));

jest.mock("officeparser", () => ({
  __esModule: true,
  default: {
    parseOfficeAsync: (...args: any[]) => mockParseOfficeAsync(...args),
  },
}));

import readSharepointContent from "../../src/actions/providers/microsoft/readSharepointContent";
import { ApiError } from "../../src/actions/util/axiosClient";
import { MISSING_SITES_SCOPE_MESSAGE } from "../../src/actions/providers/microsoft/sharepointUtils";
import { MISSING_AUTH_TOKEN } from "../../src/actions/util/missingAuthConstants";

const AUTH = { authToken: "test-token" };

function metadataResponse(mimeType: string, size = 1000) {
  return {
    data: {
      id: "item-1",
      name: "test-file",
      webUrl: "https://contoso.sharepoint.com/test-file",
      size,
      file: { mimeType },
    },
  };
}

describe("microsoft readSharepointContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns MISSING_AUTH_TOKEN without an auth token", async () => {
    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: { authToken: "" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_AUTH_TOKEN);
  });

  it("requires either url or driveItem", async () => {
    const result = await readSharepointContent({
      params: {},
      authParams: AUTH,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("driveItem");
  });

  it("reads a plain text file", async () => {
    mockGet
      .mockResolvedValueOnce(metadataResponse("text/plain"))
      .mockResolvedValueOnce({
        data: Buffer.from("hello sharepoint", "utf-8"),
      });

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toBe("hello sharepoint");
    expect(result.results?.[0].contents?.fileLength).toBe(
      "hello sharepoint".length,
    );
    expect(mockGet).toHaveBeenLastCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-1/items/item-1/content",
      expect.objectContaining({ responseType: "arraybuffer" }),
    );
  });

  it("converts a docx file with mammoth", async () => {
    mockGet
      .mockResolvedValueOnce(
        metadataResponse(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      )
      .mockResolvedValueOnce({ data: Buffer.from("fake-docx-bytes") });
    mockExtractRawText.mockResolvedValueOnce({ value: "parsed docx text" });

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toBe("parsed docx text");
    expect(mockExtractRawText).toHaveBeenCalledTimes(1);
  });

  it("converts a pdf file with extractTextFromPdf", async () => {
    mockGet
      .mockResolvedValueOnce(metadataResponse("application/pdf"))
      .mockResolvedValueOnce({ data: Buffer.from("fake-pdf-bytes") });
    mockExtractTextFromPdf.mockResolvedValueOnce("parsed pdf text");

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toBe("parsed pdf text");
  });

  it("converts an xlsx file to CSV-style text preserving tables", async () => {
    const workbook = xlsxUtils.book_new();
    const sheet = xlsxUtils.aoa_to_sheet([
      ["Name", "Qty"],
      ["Apple", 3],
    ]);
    xlsxUtils.book_append_sheet(workbook, sheet, "Inventory");
    const buffer = xlsxWrite(workbook, { type: "buffer", bookType: "xlsx" });

    mockGet
      .mockResolvedValueOnce(
        metadataResponse(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ),
      )
      .mockResolvedValueOnce({ data: buffer });

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toContain(
      "--- Sheet: Inventory ---",
    );
    expect(result.results?.[0].contents?.content).toContain("Name,Qty");
    expect(result.results?.[0].contents?.content).toContain("Apple,3");
  });

  it("converts a pptx file with officeparser", async () => {
    mockGet
      .mockResolvedValueOnce(
        metadataResponse(
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ),
      )
      .mockResolvedValueOnce({ data: Buffer.from("fake-pptx-bytes") });
    mockParseOfficeAsync.mockResolvedValueOnce("parsed pptx text");

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toBe("parsed pptx text");
  });

  it("rejects files over the size limit with a clear error", async () => {
    mockGet.mockResolvedValueOnce(
      metadataResponse("application/pdf", 100 * 1024 * 1024),
    );

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("File too large: 100.0MB exceeds the 50MB limit");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("soft-truncates content at charLimit and notes the truncation", async () => {
    const longText = "a".repeat(500);
    mockGet
      .mockResolvedValueOnce(metadataResponse("text/plain"))
      .mockResolvedValueOnce({ data: Buffer.from(longText, "utf-8") });

    const result = await readSharepointContent({
      params: {
        driveItem: { driveId: "drive-1", itemId: "item-1" },
        charLimit: 100,
      },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toContain("a".repeat(100));
    expect(result.results?.[0].contents?.content).toContain(
      "[Content truncated to 100 characters]",
    );
    expect(result.results?.[0].contents?.fileLength).toBe(500);
  });

  it("returns an error for unsupported file types", async () => {
    mockGet
      .mockResolvedValueOnce(metadataResponse("image/png"))
      .mockResolvedValueOnce({ data: Buffer.from("fake-png-bytes") });

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "item-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported file type: image/png");
  });

  it("reads a site page by concatenating text-bearing webparts", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/SitePages/Launch-Plan.aspx";
    mockGet
      .mockResolvedValueOnce({ data: { id: "site-1" } })
      .mockResolvedValueOnce({
        data: {
          value: [
            {
              id: "page-7",
              name: "Launch-Plan.aspx",
              title: "Launch Plan",
              webUrl: url,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          value: [
            { innerHtml: "<h1>Launch Plan</h1>" },
            { somethingElse: true },
            { innerHtml: "<p>Phase &amp; scope: <b>Q3</b></p>" },
          ],
        },
      });

    const result = await readSharepointContent({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].name).toBe("Launch Plan");
    expect(result.results?.[0].contents?.content).toBe(
      "Launch Plan\n\nPhase & scope: Q3",
    );
    expect(mockGet).toHaveBeenLastCalledWith(
      "https://graph.microsoft.com/v1.0/sites/site-1/pages/page-7/microsoft.graph.sitePage/webparts",
      expect.anything(),
    );
  });

  it("returns MISSING_SITES_SCOPE when page reads fail with 403", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/SitePages/Launch-Plan.aspx";
    mockGet.mockRejectedValueOnce(
      new ApiError("Request failed with status 403", 403, {}),
    );

    const result = await readSharepointContent({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_SITES_SCOPE_MESSAGE);
  });

  it("directs the caller to listSharepointFolder for folders", async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: "folder-1", name: "Reports", folder: { childCount: 3 } },
    });

    const result = await readSharepointContent({
      params: { driveItem: { driveId: "drive-1", itemId: "folder-1" } },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("listSharepointFolder");
  });
});
