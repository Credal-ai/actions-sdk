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

import searchSharepoint from "../../src/actions/providers/microsoft/searchSharepoint";
import { ApiError } from "../../src/actions/util/axiosClient";
import { MISSING_SITES_SCOPE } from "../../src/actions/providers/microsoft/utils";
import { MISSING_AUTH_TOKEN } from "../../src/actions/util/missingAuthConstants";

const AUTH = { authToken: "test-token" };

function hit(id: string, name: string, summary?: string) {
  return {
    summary,
    resource: {
      id,
      name,
      webUrl: `https://contoso.sharepoint.com/${name}`,
      lastModifiedDateTime: "2026-01-01T00:00:00Z",
      file: { mimeType: "text/plain" },
      parentReference: { driveId: "drive-1" },
    },
  };
}

function searchResponse(hits: unknown[], moreResultsAvailable: boolean) {
  return {
    data: { value: [{ hitsContainers: [{ hits, moreResultsAvailable }] }] },
  };
}

describe("microsoft searchSharepoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns MISSING_AUTH_TOKEN without an auth token", async () => {
    const result = await searchSharepoint({
      params: { query: "budget" },
      authParams: { authToken: "" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_AUTH_TOKEN);
  });

  it("searches tenant-wide via POST /search/query when no scopeUrl is given", async () => {
    mockPost.mockResolvedValueOnce(
      searchResponse(
        [hit("item-1", "budget.xlsx", "the budget for Q3")],
        false,
      ),
    );

    const result = await searchSharepoint({
      params: { query: "budget" },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.truncated).toBe(false);
    expect(result.files).toEqual([
      {
        itemId: "item-1",
        driveId: "drive-1",
        name: "budget.xlsx",
        mimeType: "text/plain",
        webUrl: "https://contoso.sharepoint.com/budget.xlsx",
        snippet: "the budget for Q3",
        lastModified: "2026-01-01T00:00:00Z",
      },
    ]);
    expect(mockGet).not.toHaveBeenCalled();
    const [postUrl, postBody] = mockPost.mock.calls[0] as [string, any];
    expect(postUrl).toBe("https://graph.microsoft.com/v1.0/search/query");
    expect(postBody.requests[0].entityTypes).toEqual(["driveItem"]);
    expect(postBody.requests[0].query.queryString).toBe("budget");
  });

  it("resolves a site scopeUrl and appends KQL path scoping", async () => {
    const scopeUrl = "https://contoso.sharepoint.com/sites/finance";
    mockGet
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 404", 404, {}),
      )
      .mockResolvedValueOnce({ data: { id: "site-1", webUrl: scopeUrl } });
    mockPost.mockResolvedValueOnce(searchResponse([], false));

    const result = await searchSharepoint({
      params: { query: "budget", scopeUrl },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    const [, postBody] = mockPost.mock.calls[0] as [string, any];
    expect(postBody.requests[0].query.queryString).toBe(
      'budget path:"https://contoso.sharepoint.com/sites/finance"',
    );
  });

  it("pages via from/size and reports truncated when more results remain", async () => {
    mockPost.mockResolvedValueOnce(
      searchResponse(
        [
          hit("item-1", "a.txt"),
          hit("item-2", "b.txt"),
          hit("item-3", "c.txt"),
        ],
        true,
      ),
    );

    const result = await searchSharepoint({
      params: { query: "budget", limit: 2 },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  it("requests further pages until the limit is reached", async () => {
    mockPost
      .mockResolvedValueOnce(
        searchResponse([hit("item-1", "a.txt"), hit("item-2", "b.txt")], true),
      )
      .mockResolvedValueOnce(searchResponse([hit("item-3", "c.txt")], false));

    const result = await searchSharepoint({
      params: { query: "budget", limit: 10 },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(3);
    expect(result.truncated).toBe(false);
    expect(mockPost).toHaveBeenCalledTimes(2);
    const [, secondBody] = mockPost.mock.calls[1] as [string, any];
    expect(secondBody.requests[0].from).toBe(2);
  });

  it("dedupes results by itemId keeping the first", async () => {
    mockPost.mockResolvedValueOnce(
      searchResponse(
        [hit("item-1", "a.txt", "first"), hit("item-1", "a.txt", "second")],
        false,
      ),
    );

    const result = await searchSharepoint({
      params: { query: "budget" },
      authParams: AUTH,
    });

    expect(result.files).toHaveLength(1);
    expect(result.files?.[0].snippet).toBe("first");
  });

  it("searches within a folder via an item-scoped drive search when scopeUrl resolves to a folder", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          id: "folder-1",
          name: "Reports",
          folder: {},
          parentReference: { driveId: "drive-1" },
        },
      })
      .mockResolvedValueOnce({
        data: {
          value: [
            {
              id: "item-1",
              name: "a.txt",
              parentReference: { driveId: "drive-1" },
            },
          ],
        },
      });

    const result = await searchSharepoint({
      params: {
        query: "budget",
        scopeUrl:
          "https://contoso.sharepoint.com/sites/finance/Shared%20Documents/Reports",
      },
      authParams: AUTH,
    });

    expect(result.success).toBe(true);
    expect(result.files).toEqual([
      {
        itemId: "item-1",
        driveId: "drive-1",
        name: "a.txt",
        mimeType: undefined,
        webUrl: undefined,
        snippet: undefined,
        lastModified: undefined,
      },
    ]);
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockGet).toHaveBeenLastCalledWith(
      "https://graph.microsoft.com/v1.0/drives/drive-1/items/folder-1/search(q='budget')?$top=100",
      expect.anything(),
    );
  });

  it("returns MISSING_SITES_SCOPE for a site scopeUrl when site resolution fails with 403", async () => {
    mockGet
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 404", 404, {}),
      )
      .mockRejectedValueOnce(
        new ApiError("Request failed with status 403", 403, {}),
      );

    const result = await searchSharepoint({
      params: {
        query: "budget",
        scopeUrl: "https://contoso.sharepoint.com/sites/finance",
      },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_SITES_SCOPE);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns MISSING_SITES_SCOPE when tenant-wide /search/query returns 403", async () => {
    mockPost.mockRejectedValueOnce(
      new ApiError("Request failed with status 403", 403, {}),
    );

    const result = await searchSharepoint({
      params: { query: "budget" },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(MISSING_SITES_SCOPE);
  });

  it("rejects a scopeUrl that points to a file", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        id: "item-1",
        name: "a.txt",
        file: { mimeType: "text/plain" },
        parentReference: { driveId: "drive-1" },
      },
    });

    const result = await searchSharepoint({
      params: {
        query: "budget",
        scopeUrl:
          "https://contoso.sharepoint.com/sites/finance/Shared%20Documents/a.txt",
      },
      authParams: AUTH,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("file");
    expect(mockPost).not.toHaveBeenCalled();
  });
});
