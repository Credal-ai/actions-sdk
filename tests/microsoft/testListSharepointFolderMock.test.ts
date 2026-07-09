import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockPost = jest.fn<(...args: any[]) => Promise<any>>();

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

import listSharepointFolder from "../../src/actions/providers/microsoft/listSharepointFolder";
import { ApiError } from "../../src/actions/util/axiosClient";
import { MISSING_SITES_SCOPE } from "../../src/actions/providers/microsoft/utils";
import { MISSING_AUTH_TOKEN } from "../../src/actions/util/missingAuthConstants";

const AUTH = { authToken: "test-token" };

function fileItem(id: string, name: string) {
  return {
    id,
    name,
    webUrl: `https://contoso.sharepoint.com/${name}`,
    size: 100,
    lastModifiedDateTime: "2026-01-01T00:00:00Z",
    file: { mimeType: "text/plain" },
    parentReference: { driveId: "drive-1" },
  };
}

function folderItem(id: string, name: string) {
  return {
    id,
    name,
    webUrl: `https://contoso.sharepoint.com/${name}`,
    folder: { childCount: 1 },
    parentReference: { driveId: "drive-1" },
  };
}

describe("microsoft listSharepointFolder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns MISSING_AUTH_TOKEN without an auth token", async () => {
    const result = await listSharepointFolder({
      params: { driveId: "drive-1", itemId: "folder-1" },
      authParams: { authToken: "" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_AUTH_TOKEN);
  });

  it("requires either url or driveId + itemId", async () => {
    const result = await listSharepointFolder({ params: {}, authParams: AUTH });
    expect(result.success).toBe(false);
    expect(result.error).toContain("driveId");
  });

  it("lists a folder's children given driveId + itemId", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        value: [
          fileItem("item-1", "a.txt"),
          folderItem("folder-2", "Subfolder"),
        ],
      },
    });

    const result = await listSharepointFolder({
      params: { driveId: "drive-1", itemId: "folder-1" },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.truncated).toBe(false);
    expect(result.items).toEqual([
      {
        itemId: "item-1",
        driveId: "drive-1",
        name: "a.txt",
        itemType: "file",
        mimeType: "text/plain",
        sizeBytes: 100,
        webUrl: "https://contoso.sharepoint.com/a.txt",
        lastModified: "2026-01-01T00:00:00Z",
      },
      {
        itemId: "folder-2",
        driveId: "drive-1",
        name: "Subfolder",
        itemType: "folder",
        mimeType: undefined,
        sizeBytes: undefined,
        webUrl: "https://contoso.sharepoint.com/Subfolder",
        lastModified: undefined,
      },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-1/items/folder-1/children?$top=200",
      expect.anything(),
    );
  });

  it("follows @odata.nextLink pagination", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          value: [fileItem("item-1", "a.txt")],
          "@odata.nextLink": "https://graph.microsoft.com/v1.0/next-page",
        },
      })
      .mockResolvedValueOnce({
        data: { value: [fileItem("item-2", "b.txt")] },
      });

    const result = await listSharepointFolder({
      params: { driveId: "drive-1", itemId: "folder-1" },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.truncated).toBe(false);
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenLastCalledWith(
      "https://graph.microsoft.com/v1.0/next-page",
      expect.anything(),
    );
  });

  it("stops at maxItems and reports truncated", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        value: [
          fileItem("item-1", "a.txt"),
          fileItem("item-2", "b.txt"),
          fileItem("item-3", "c.txt"),
        ],
      },
    });

    const result = await listSharepointFolder({
      params: { driveId: "drive-1", itemId: "folder-1", maxItems: 2 },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  it("recurses into subfolders breadth-first when recursive is true", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          value: [
            folderItem("folder-2", "Subfolder"),
            fileItem("item-1", "a.txt"),
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { value: [fileItem("item-2", "nested.txt")] },
      });

    const result = await listSharepointFolder({
      params: { driveId: "drive-1", itemId: "folder-1", recursive: true },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.items?.map((item) => item.itemId)).toEqual([
      "folder-2",
      "item-1",
      "item-2",
    ]);
    expect(mockGet).toHaveBeenLastCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-1/items/folder-2/children?$top=200",
      expect.anything(),
    );
  });

  it("lists the default document library root for a site URL", async () => {
    const url = "https://contoso.sharepoint.com/sites/marketing";
    mockGet
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 404", 404, {}),
      )
      .mockResolvedValueOnce({
        data: { id: "site-1", displayName: "Marketing" },
      })
      .mockResolvedValueOnce({ data: { id: "drive-9" } })
      .mockResolvedValueOnce({
        data: { value: [fileItem("item-1", "a.txt")] },
      });

    const result = await listSharepointFolder({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(mockGet).toHaveBeenLastCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-9/root/children?$top=200",
      expect.anything(),
    );
  });

  it("returns MISSING_SITES_SCOPE when a site URL cannot be resolved due to 403", async () => {
    const url = "https://contoso.sharepoint.com/sites/marketing";
    mockGet
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 403", 403, {}),
      )
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 403", 403, {}),
      );

    const result = await listSharepointFolder({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_SITES_SCOPE);
  });

  it("rejects file URLs", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/Shared%20Documents/a.txt";
    mockGet.mockResolvedValueOnce({ data: fileItem("item-1", "a.txt") });

    const result = await listSharepointFolder({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("file");
  });
});
