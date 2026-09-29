import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGet =
  jest.fn<(url: string, config?: unknown) => Promise<{ data: unknown }>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: { get: (url: string, config?: unknown) => mockGet(url, config) },
  createAxiosClientWithRetries: () => ({ get: mockGet }),
  createAxiosClientWithTimeout: () => ({ get: mockGet }),
}));

jest.mock("marklassian", () => ({ markdownToAdf: jest.fn() }));
jest.mock("jira.js", () => ({ Version3Client: jest.fn() }));

import getJiraDCIssuesByQuery from "../../src/actions/providers/jira/getJiraDCIssuesByQuery";
import getJiraIssuesByQuery from "../../src/actions/providers/jira/getJiraIssuesByQuery";
import {
  jiraDataCenterGetJiraIssuesByQueryOutputSchema,
  jiraDataCenterGetJiraIssuesByQueryParamsSchema,
} from "../../src/actions/autogen/types";

const dcAuth = {
  authToken: "test-token",
  provider: "jiraDataCenter",
  baseUrl: "https://jira.example.test/",
};
const cloudAuth = {
  authToken: "test-token",
  provider: "jira",
  cloudId: "site-id",
};
const issue = (id = "10042") => ({
  id,
  key: `ENG-${id}`,
  fields: {
    summary: "Assess this ticket",
    description: "Data Center plain text",
    project: { id: "1", key: "ENG", name: "Engineering" },
    issuetype: { id: "2", name: "Bug" },
    status: { id: "3", name: "Open", statusCategory: { name: "To Do" } },
    created: "2026-09-21T14:00:00.000+0000",
    updated: "2026-09-21T14:00:00.000+0000",
  },
});
const dcPage = (
  startAt: number,
  total: number,
  issues: ReturnType<typeof issue>[],
) => ({
  data: { startAt, total, issues },
});
const params = { query: "project = ENG ORDER BY id ASC" };

describe("Jira Data Center query pagination", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("advances by actual page length and exposes continuation from a nonzero offset", async () => {
    mockGet
      .mockResolvedValueOnce(dcPage(10, 20, [issue("11")]))
      .mockResolvedValueOnce(dcPage(11, 20, [issue("12")]));

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, startAt: 10, limit: 2 },
    });

    expect(result).toMatchObject({
      sourceUrl: "https://jira.example.test",
      startAt: 10,
      total: 20,
      itemsReturned: 2,
      nextStartAt: 12,
      isLast: false,
    });
    expect(result.results?.[0].contents.description).toBe(
      "Data Center plain text",
    );
    expect(
      mockGet.mock.calls.map(([url]) =>
        new URL(url).searchParams.get("startAt"),
      ),
    ).toEqual(["10", "11"]);
    expect(
      mockGet.mock.calls.map(([url]) =>
        new URL(url).searchParams.get("maxResults"),
      ),
    ).toEqual(["2", "1"]);
    expect(mockGet.mock.calls[0][1]).toMatchObject({
      maxRedirects: 0,
      timeout: 30_000,
    });
    expect(
      jiraDataCenterGetJiraIssuesByQueryOutputSchema.safeParse(result).success,
    ).toBe(true);
  });

  it("returns completion only at the reported total", async () => {
    mockGet.mockResolvedValueOnce(dcPage(2, 3, [issue()]));

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, startAt: 2 },
    });

    expect(result).toMatchObject({
      isLast: true,
      itemsReturned: 1,
      total: 3,
      startAt: 2,
    });
    expect(result).not.toHaveProperty("nextStartAt");
  });

  it("keeps the existing default limit of 100 and permits a complete empty query", async () => {
    mockGet.mockResolvedValueOnce(dcPage(0, 0, []));

    const result = await getJiraDCIssuesByQuery({ authParams: dcAuth, params });

    expect(result).toMatchObject({
      isLast: true,
      itemsReturned: 0,
      results: [],
    });
    expect(
      new URL(mockGet.mock.calls[0][0]).searchParams.get("maxResults"),
    ).toBe("100");
  });

  it.each([
    { startAt: 1, total: 4, issues: [] },
    { startAt: 0, total: 4, issues: [issue()] },
    { startAt: 1.5, total: 4, issues: [issue()] },
    { startAt: 1, total: -1, issues: [] },
    { startAt: 1, total: 1, issues: [issue()] },
    {
      startAt: 1,
      total: 3,
      issues: [issue()],
      warningMessages: ["Query was not fully evaluated"],
    },
    { errorMessages: ["JQL error"] },
  ])(
    "discards earlier results when a later page is incomplete or malformed: %j",
    async (secondPage) => {
      mockGet
        .mockResolvedValueOnce(dcPage(0, 4, [issue()]))
        .mockResolvedValueOnce({ data: secondPage });

      const result = await getJiraDCIssuesByQuery({
        authParams: dcAuth,
        params,
      });

      expect(result).toEqual({ results: [], error: expect.any(String) });
    },
  );

  it("discards partial results on transport failure without logging the raw error", async () => {
    const log = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockGet
      .mockResolvedValueOnce(dcPage(0, 2, [issue()]))
      .mockRejectedValueOnce(new Error("Read failed"));

    const result = await getJiraDCIssuesByQuery({ authParams: dcAuth, params });

    expect(result).toEqual({ results: [], error: "Read failed" });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it.each([{ startAt: -1 }, { startAt: 0.5 }, { limit: 0 }, { limit: 1.5 }])(
    "rejects invalid pagination in the generated contract: %j",
    (invalid) => {
      expect(
        jiraDataCenterGetJiraIssuesByQueryParamsSchema.safeParse({
          ...params,
          ...invalid,
        }).success,
      ).toBe(false);
    },
  );

  it("bounds internal pagination instead of returning a partial success", async () => {
    mockGet.mockImplementation(async (url) => {
      const startAt = Number(new URL(url).searchParams.get("startAt"));
      return dcPage(startAt, 101, [issue(String(startAt))]);
    });

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, limit: 101 },
    });

    expect(result).toEqual({
      results: [],
      error: expect.stringContaining("100 pages"),
    });
    expect(mockGet).toHaveBeenCalledTimes(100);
  });
});

describe("Jira query full execution input", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("preserves full Data Center fields and every page of plain text comments", async () => {
    mockGet
      .mockResolvedValueOnce(dcPage(0, 1, [issue()]))
      .mockResolvedValueOnce({
        data: {
          ...issue(),
          fields: { ...issue().fields, customfield_123: "Required context" },
        },
      })
      .mockResolvedValueOnce({
        data: {
          startAt: 0,
          total: 2,
          comments: [{ id: "1", body: "First comment" }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          startAt: 1,
          total: 2,
          comments: [{ id: "2", body: "Second comment" }],
        },
      });

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, includeFullDetails: true, limit: 1 },
    });

    expect(result.results?.[0].contents.details).toMatchObject({
      id: "10042",
      fields: {
        description: "Data Center plain text",
        customfield_123: "Required context",
      },
      comments: [
        { id: "1", body: "First comment" },
        { id: "2", body: "Second comment" },
      ],
      fetchedAt: expect.any(String),
    });
    expect(mockGet.mock.calls[1][0]).toContain(
      "/rest/api/2/issue/10042?fields=*all",
    );
    expect(mockGet.mock.calls[3][0]).toContain(
      "/comment?startAt=1&maxResults=100",
    );
  });

  it("keeps Cloud ADF intact in full details", async () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Context" }] },
      ],
    };
    mockGet
      .mockResolvedValueOnce({ data: { issues: [issue()], isLast: true } })
      .mockResolvedValueOnce({
        data: { ...issue(), fields: { description: adf } },
      })
      .mockResolvedValueOnce({
        data: { startAt: 0, total: 1, comments: [{ id: "1", body: adf }] },
      });

    const result = await getJiraIssuesByQuery({
      authParams: cloudAuth,
      params: { ...params, includeFullDetails: true, limit: 1 },
    });

    expect(result.results?.[0].contents.details).toMatchObject({
      fields: { description: adf },
      comments: [{ id: "1", body: adf }],
    });
  });

  it.each([
    { startAt: 1, total: 2, comments: [] },
    { startAt: 0, total: 2, comments: [] },
    { startAt: 0, total: 0, comments: [{ id: "1" }] },
  ])(
    "fails the whole action on malformed or incomplete comments: %j",
    async (commentPage) => {
      mockGet
        .mockResolvedValueOnce(dcPage(0, 1, [issue()]))
        .mockResolvedValueOnce({ data: issue() })
        .mockResolvedValueOnce({ data: commentPage });

      const result = await getJiraDCIssuesByQuery({
        authParams: dcAuth,
        params: { ...params, includeFullDetails: true, limit: 1 },
      });

      expect(result).toEqual({ results: [], error: expect.any(String) });
    },
  );

  it("rejects hydration of a different issue identity", async () => {
    mockGet
      .mockResolvedValueOnce(dcPage(0, 1, [issue()]))
      .mockResolvedValueOnce({ data: issue("another-id") });

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, includeFullDetails: true, limit: 1 },
    });

    expect(result).toEqual({
      results: [],
      error: expect.stringContaining("different issue identity"),
    });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("enforces a bytes budget and returns no truncated execution input", async () => {
    mockGet
      .mockResolvedValueOnce(dcPage(0, 1, [issue()]))
      .mockResolvedValueOnce({
        data: { ...issue(), fields: { description: "é".repeat(1_000_001) } },
      })
      .mockResolvedValueOnce({ data: { startAt: 0, total: 0, comments: [] } });

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, includeFullDetails: true, limit: 1 },
    });

    expect(result).toEqual({
      results: [],
      error: expect.stringContaining("2 MB"),
    });
  });

  it("requires an explicit single-issue limit before fetching full details", async () => {
    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, includeFullDetails: true },
    });

    expect(result).toEqual({
      results: [],
      error: expect.stringContaining("limit of 1"),
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("stops comment pagination when the invocation is cancelled", async () => {
    const controller = new AbortController();
    mockGet
      .mockResolvedValueOnce(dcPage(0, 1, [issue()]))
      .mockResolvedValueOnce({ data: issue() })
      .mockImplementationOnce(async (_url, config) => {
        expect(config).toMatchObject({ signal: controller.signal });
        controller.abort(new Error("Trigger cancelled"));
        return { data: { startAt: 0, total: 2, comments: [{ id: "1" }] } };
      });

    const result = await getJiraDCIssuesByQuery({
      authParams: dcAuth,
      params: { ...params, includeFullDetails: true, limit: 1 },
      signal: controller.signal,
    });

    expect(result).toEqual({ results: [], error: "Trigger cancelled" });
    expect(mockGet).toHaveBeenCalledTimes(3);
  });
});

describe("Jira Cloud query pagination", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("stops discovery before requesting a continuation page after cancellation", async () => {
    const controller = new AbortController();
    mockGet.mockImplementationOnce(async (_url, config) => {
      expect(config).toMatchObject({ signal: controller.signal });
      controller.abort(new Error("Trigger cancelled"));
      return {
        data: { issues: [issue()], nextPageToken: "next", isLast: false },
      };
    });

    const result = await getJiraIssuesByQuery({
      authParams: cloudAuth,
      params,
      signal: controller.signal,
    });

    expect(result).toEqual({ results: [], error: "Trigger cancelled" });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("continues across an empty intermediate page and returns the next cursor", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: { issues: [], nextPageToken: "second", isLast: false },
      })
      .mockResolvedValueOnce({
        data: { issues: [issue()], nextPageToken: "third", isLast: false },
      });

    const result = await getJiraIssuesByQuery({
      authParams: cloudAuth,
      params: { ...params, limit: 1 },
    });

    expect(result).toMatchObject({
      sourceUrl: "https://api.atlassian.com/ex/jira/site-id",
      itemsReturned: 1,
      isLast: false,
      nextPageToken: "third",
    });
    expect(
      new URL(mockGet.mock.calls[1][0]).searchParams.get("nextPageToken"),
    ).toBe("second");
  });

  it.each([
    { issues: [], isLast: false },
    { issues: [], isLast: true, nextPageToken: "next" },
    { issues: [], nextPageToken: "" },
    { issues: [], nextPageToken: "initial" },
    { issues: [], warningMessages: ["Query was not fully evaluated"] },
  ])("rejects malformed or looping continuation: %j", async (page) => {
    mockGet.mockResolvedValueOnce({ data: page });

    const result = await getJiraIssuesByQuery({
      authParams: cloudAuth,
      params: { ...params, nextPageToken: "initial" },
    });

    expect(result).toEqual({ results: [], error: expect.any(String) });
  });
});
