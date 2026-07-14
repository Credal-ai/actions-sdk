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

import getSharepointItem from "../../src/actions/providers/microsoft/getSharepointItem";
import { ApiError } from "../../src/actions/util/axiosClient";
import {
  MISSING_SITES_SCOPE,
  encodeShareUrl,
} from "../../src/actions/providers/microsoft/utils";
import { MISSING_AUTH_TOKEN } from "../../src/actions/util/missingAuthConstants";

const AUTH = { authToken: "test-token" };

describe("microsoft getSharepointItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns MISSING_AUTH_TOKEN without an auth token", async () => {
    const result = await getSharepointItem({
      params: { url: "https://contoso.sharepoint.com/sites/marketing" },
      authParams: { authToken: "" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_AUTH_TOKEN);
  });

  it("resolves a file URL via the /shares endpoint", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/Shared%20Documents/Report.docx";
    mockGet.mockResolvedValueOnce({
      data: {
        id: "item-1",
        name: "Report.docx",
        webUrl: url,
        size: 1234,
        file: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        parentReference: { driveId: "drive-1", siteId: "site-1" },
      },
    });

    const result = await getSharepointItem({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.item).toEqual({
      itemType: "file",
      name: "Report.docx",
      webUrl: url,
      driveId: "drive-1",
      itemId: "item-1",
      siteId: "site-1",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 1234,
    });
    expect(mockGet).toHaveBeenCalledWith(
      `https://graph.microsoft.com/v1.0/shares/${encodeShareUrl(url)}/driveItem`,
      expect.anything(),
    );
  });

  it("resolves a folder URL (folder facet present)", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/Shared%20Documents/Reports";
    mockGet.mockResolvedValueOnce({
      data: {
        id: "folder-1",
        name: "Reports",
        webUrl: url,
        folder: { childCount: 5 },
        parentReference: { driveId: "drive-1" },
      },
    });

    const result = await getSharepointItem({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.item?.itemType).toBe("folder");
    expect(result.item?.driveId).toBe("drive-1");
    expect(result.item?.itemId).toBe("folder-1");
  });

  it("resolves a bare site URL to a site with its drives", async () => {
    const url = "https://contoso.sharepoint.com/sites/marketing";
    mockGet
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 404", 404, {}),
      )
      .mockResolvedValueOnce({
        data: {
          id: "contoso.sharepoint.com,guid1,guid2",
          displayName: "Marketing",
          webUrl: url,
        },
      })
      .mockResolvedValueOnce({
        data: {
          value: [
            {
              id: "drive-1",
              name: "Documents",
              webUrl:
                "https://contoso.sharepoint.com/sites/marketing/Shared%20Documents",
            },
            {
              id: "drive-2",
              name: "Site Assets",
              webUrl:
                "https://contoso.sharepoint.com/sites/marketing/SiteAssets",
            },
          ],
        },
      });

    const result = await getSharepointItem({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.item?.itemType).toBe("site");
    expect(result.item?.siteId).toBe("contoso.sharepoint.com,guid1,guid2");
    expect(result.item?.drives).toEqual([
      {
        driveId: "drive-1",
        name: "Documents",
        webUrl:
          "https://contoso.sharepoint.com/sites/marketing/Shared%20Documents",
      },
      {
        driveId: "drive-2",
        name: "Site Assets",
        webUrl: "https://contoso.sharepoint.com/sites/marketing/SiteAssets",
      },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/marketing",
      expect.anything(),
    );
  });

  it("resolves a site page URL to a page", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/SitePages/Launch-Plan.aspx";
    mockGet
      .mockResolvedValueOnce({
        data: { id: "site-1", displayName: "Marketing" },
      })
      .mockResolvedValueOnce({
        data: {
          value: [
            { id: "page-0", name: "Home.aspx", title: "Home", webUrl: "..." },
            {
              id: "page-7",
              name: "Launch-Plan.aspx",
              title: "Launch Plan",
              webUrl: url,
            },
          ],
        },
      });

    const result = await getSharepointItem({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.item).toEqual({
      itemType: "page",
      siteId: "site-1",
      itemId: "page-7",
      name: "Launch Plan",
      webUrl: url,
    });
  });

  it("returns MISSING_SITES_SCOPE when site resolution fails with 403", async () => {
    const url = "https://contoso.sharepoint.com/sites/marketing";
    mockGet
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 404", 404, {}),
      )
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 403", 403, {}),
      );

    const result = await getSharepointItem({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_SITES_SCOPE);
  });

  it("propagates errors for unresolvable non-site URLs", async () => {
    const url =
      "https://contoso.sharepoint.com/sites/marketing/Shared%20Documents/missing.docx";
    mockGet.mockRejectedValueOnce(
      new ApiError("Request failed with status 404", 404, {}),
    );

    const result = await getSharepointItem({
      params: { url },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("404");
  });
});
