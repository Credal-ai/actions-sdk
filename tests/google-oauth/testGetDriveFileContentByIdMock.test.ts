import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockParseOffice =
  jest.fn<(...args: any[]) => Promise<{ toText: () => string }>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  createAxiosClientWithTimeout: () => ({
    get: (...args: any[]) => mockGet(...args),
  }),
}));

jest.mock("officeparser", () => ({
  __esModule: true,
  default: {
    parseOffice: (...args: any[]) => mockParseOffice(...args),
  },
}));

import getDriveFileContentById from "../../src/actions/providers/google-oauth/getDriveFileContentById";

const AUTH = { authToken: "test-token" };
const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function mockPptxDownload() {
  mockGet
    .mockResolvedValueOnce({
      data: {
        name: "presentation.pptx",
        mimeType: PPTX_MIME_TYPE,
        size: "16",
      },
    })
    .mockResolvedValueOnce({ data: Buffer.from("fake-pptx-bytes") });
}

describe("googleOauth getDriveFileContentById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("converts a pptx file with officeparser", async () => {
    mockPptxDownload();
    const toText = jest.fn(() => "Slide one\n\nSlide two");
    mockParseOffice.mockResolvedValueOnce({ toText });

    const result = await getDriveFileContentById({
      params: { fileId: "file-1" },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.results?.[0].contents?.content).toBe("Slide one Slide two");
    expect(mockParseOffice).toHaveBeenCalledWith(
      Buffer.from("fake-pptx-bytes"),
    );
    expect(toText).toHaveBeenCalledTimes(1);
  });

  it("returns a clear error when officeparser rejects a pptx file", async () => {
    mockPptxDownload();
    mockParseOffice.mockRejectedValueOnce(new Error("invalid archive"));

    const result = await getDriveFileContentById({
      params: { fileId: "file-1" },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Failed to parse PowerPoint document: invalid archive",
    );
  });
});
