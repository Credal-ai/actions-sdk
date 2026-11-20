import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import listFilesWithAssignedComments from "../../src/actions/providers/google-oauth/listFilesWithAssignedComments";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: { get: (...args: any[]) => mockGet(...args) },
}));

const AUTH = { authToken: "test-token" };
const NO_AUTH = { authToken: "" };

const MOCK_FILES = [
  { id: "file1", name: "Doc with comment", mimeType: "application/vnd.google-apps.document", webViewLink: "https://docs.google.com/document/d/file1/edit" },
  { id: "file2", name: "Sheet with comment", mimeType: "application/vnd.google-apps.spreadsheet", webViewLink: "https://docs.google.com/spreadsheets/d/file2/edit" },
];

describe("listFilesWithAssignedComments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns files from both corpora, deduped", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { files: [MOCK_FILES[0]] } }) // allDrives
      .mockResolvedValueOnce({ data: { files: [MOCK_FILES[1]] } }); // domain

    const result = await listFilesWithAssignedComments({
      params: {},
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.files![0]).toEqual({
      id: "file1",
      name: "Doc with comment",
      mimeType: "application/vnd.google-apps.document",
      url: "https://docs.google.com/document/d/file1/edit",
    });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("deduplicates files that appear in both corpora", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { files: [MOCK_FILES[0]] } })
      .mockResolvedValueOnce({ data: { files: [MOCK_FILES[0]] } }); // same file in both

    const result = await listFilesWithAssignedComments({
      params: {},
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(1);
  });

  it("respects the limit param", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { files: MOCK_FILES } })
      .mockResolvedValueOnce({ data: { files: [] } });

    const result = await listFilesWithAssignedComments({
      params: { limit: 1 },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(1);
  });

  it("returns empty array when no files have assigned comments", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { files: [] } })
      .mockResolvedValueOnce({ data: { files: [] } });

    const result = await listFilesWithAssignedComments({
      params: {},
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(0);
  });

  it("returns error on missing auth token", async () => {
    const result = await listFilesWithAssignedComments({
      params: {},
      authParams: NO_AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns error on API failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));

    const result = await listFilesWithAssignedComments({
      params: {},
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("uses the assignedcomments followup query", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { files: [] } })
      .mockResolvedValueOnce({ data: { files: [] } });

    await listFilesWithAssignedComments({ params: {}, authParams: AUTH });

    const firstCallUrl = mockGet.mock.calls[0][0] as string;
    expect(firstCallUrl).toContain("followup%3D'assignedcomments'");
    expect(firstCallUrl).toContain("trashed%3Dfalse");
  });
});
