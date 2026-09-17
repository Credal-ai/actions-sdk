import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockPost = jest.fn<(...args: any[]) => Promise<any>>();
const mockPut = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => {
  const actual = jest.requireActual(
    "../../src/actions/util/axiosClient",
  ) as Record<string, unknown>;
  return {
    ...actual,
    axiosClient: {
      get: (...args: any[]) => mockGet(...args),
      post: (...args: any[]) => mockPost(...args),
      put: (...args: any[]) => mockPut(...args),
    },
  };
});

import { ApiError } from "../../src/actions/util/axiosClient";
import confluenceCopyPage from "../../src/actions/providers/confluence/copyPage";
import confluenceDataCenterCopyPage from "../../src/actions/providers/confluenceDataCenter/copyPage";

// A template with enough repetitive rows that a model would be tempted to summarise it. The copy must be verbatim.
const TEMPLATE_BODY =
  `<h1>Weekly Template</h1><table><tbody>` +
  Array.from(
    { length: 40 },
    (_, i) =>
      `<tr><td><p>Row ${i}</p></td><td><ac:structured-macro ac:name="status" ac:macro-id="m${i}">` +
      `<ac:parameter ac:name="title">TBD</ac:parameter></ac:structured-macro></td></tr>`,
  ).join("") +
  `</tbody></table>`;

type Method = "get" | "post" | "put";
interface Call {
  method: Method;
  url: string;
  data?: any;
  config?: any;
}
interface Route {
  method: Method;
  match: RegExp;
  respond: (call: Call) => any;
}

let calls: Call[] = [];

/** Routes requests by full URL (baseURL + path) so tests read like the HTTP flow they assert on. */
function useRoutes(routes: Route[]) {
  calls = [];
  const dispatch =
    (method: Method) => async (url: string, a?: any, b?: any) => {
      const config = method === "get" ? a : b;
      const data = method === "get" ? undefined : a;
      const fullUrl = `${config?.baseURL ?? ""}${url}`;
      const call: Call = { method, url: fullUrl, data, config };
      calls.push(call);
      const route = routes.find(
        (r) => r.method === method && r.match.test(fullUrl),
      );
      if (!route)
        throw new Error(`Unhandled ${method.toUpperCase()} ${fullUrl}`);
      return route.respond(call);
    };
  mockGet.mockImplementation(dispatch("get"));
  mockPost.mockImplementation(dispatch("post"));
  mockPut.mockImplementation(dispatch("put"));
}

const failWith = (status: number, message: string) => () => {
  throw new ApiError(`Request failed with status ${status}`, status, {
    message,
  });
};

const attachmentList = (titles: string[], start = 0, limit = 200) => ({
  data: {
    results: titles.slice(start, start + limit).map((title, i) => ({
      id: `att-${start + i}`,
      title,
      metadata: { mediaType: "application/octet-stream" },
      _links: { download: `/download/attachments/${title}` },
    })),
  },
});

const pageOf = (url: string, param: string): number =>
  Number(new URL(url, "https://x").searchParams.get(param) ?? 0);

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPut.mockReset();
});

describe("copyPage destination validation (both providers)", () => {
  it("rejects a call with no destination before making any request", async () => {
    useRoutes([]);
    const result = await confluenceCopyPage({
      params: { sourcePageId: "100" },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/A destination is required/);
    expect(calls).toHaveLength(0);
  });

  it("rejects a call with several destinations and names them", async () => {
    useRoutes([]);
    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", destinationPageId: "1", spaceKey: "ENG" },
      authParams: {
        authToken: "token",
        baseUrl: "https://confluence.example.com",
      },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(
      /exactly one destination.*destinationPageId, spaceKey/,
    );
    expect(calls).toHaveLength(0);
  });
});

describe("confluence (Cloud) copyPage", () => {
  const V1 = "https://api.atlassian.com/ex/confluence/cloud-1/wiki/rest/api";
  const V2 = "https://api.atlassian.com/ex/confluence/cloud-1/api/v2";

  const accessibleResources: Route = {
    method: "get",
    match: /accessible-resources/,
    respond: () => ({ data: [{ id: "cloud-1" }, { id: "cloud-2" }] }),
  };
  const sourcePage: Route = {
    method: "get",
    match: new RegExp(`${V2}/pages/100\\?body-format=storage`),
    respond: () => ({
      data: {
        id: "100",
        title: "Weekly Template",
        version: { number: 7 },
        body: { storage: { value: TEMPLATE_BODY } },
      },
    }),
  };
  const destinationPage: Route = {
    method: "get",
    match: new RegExp(`${V2}/pages/200$`),
    respond: () => ({
      data: {
        id: "200",
        title: "Week 38 Report",
        version: { number: 3 },
        spaceId: "S1",
      },
    }),
  };

  it("uses authParams.cloudId and never consults accessible-resources when it is provided", async () => {
    useRoutes([
      sourcePage,
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: () => ({ data: { id: "301" } }),
      },
    ]);
    const result = await confluenceCopyPage({
      params: {
        sourcePageId: "100",
        parentPageId: "300",
        copyAttachments: false,
      },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });
    expect(result.success).toBe(true);
    expect(calls.some((c) => /accessible-resources/.test(c.url))).toBe(false);
    expect(calls.every((c) => c.url.includes("/cloud-1/"))).toBe(true);
  });

  it("falls back to the first accessible resource only when no cloudId is provided", async () => {
    useRoutes([
      accessibleResources,
      sourcePage,
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: () => ({ data: { id: "301" } }),
      },
    ]);
    const result = await confluenceCopyPage({
      params: {
        sourcePageId: "100",
        parentPageId: "300",
        copyAttachments: false,
      },
      authParams: { authToken: "token" },
    });
    expect(result.success).toBe(true);
    expect(calls[0].url).toMatch(/accessible-resources/);
  });

  it("copies onto an existing page natively, retrying once after an optimistic-lock conflict", async () => {
    let copyAttempts = 0;
    useRoutes([
      sourcePage,
      destinationPage,
      {
        method: "get",
        match: new RegExp(`${V1}/content/100/child/attachment`),
        respond: () => attachmentList(["logo.png", "data.csv"]),
      },
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: ({ data }) => {
          copyAttempts += 1;
          if (copyAttempts === 1) failWith(409, "optimistic locking failed")();
          expect(data.destination).toEqual({
            type: "existing_page",
            value: "200",
          });
          expect(data.pageTitle).toBe("Week 38 Report");
          expect(data.copyAttachments).toBe(true);
          expect(data.copyPermissions).toBe(false);
          return {
            data: {
              id: "200",
              title: "Week 38 Report",
              version: { number: 4 },
              _links: {
                base: "https://x.atlassian.net/wiki",
                webui: "/spaces/S/pages/200",
              },
            },
          };
        },
      },
      {
        // The destination already had an unrelated attachment; it must not be counted as copied.
        method: "get",
        match: new RegExp(`${V1}/content/200/child/attachment`),
        respond: () =>
          attachmentList(["unrelated.pdf", "logo.png", "data.csv"]),
      },
    ]);

    const result = await confluenceCopyPage({
      params: { sourcePageId: "100", destinationPageId: "200" },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result).toEqual({
      success: true,
      pageId: "200",
      title: "Week 38 Report",
      version: 4,
      pageUrl: "https://x.atlassian.net/wiki/spaces/S/pages/200",
      attachmentsCopied: 2,
    });
    expect(copyAttempts).toBe(2);
    expect(calls.filter((c) => c.method === "put")).toHaveLength(0);
  });

  it("paginates attachment listings when counting what was copied", async () => {
    const names = Array.from({ length: 205 }, (_, i) => `file-${i}.bin`);
    useRoutes([
      sourcePage,
      {
        method: "get",
        match: new RegExp(`${V1}/content/100/child/attachment`),
        respond: ({ url }) =>
          attachmentList(names, pageOf(url, "start"), pageOf(url, "limit")),
      },
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: () => ({ data: { id: "301" } }),
      },
      {
        method: "get",
        match: new RegExp(`${V1}/content/301/child/attachment`),
        respond: ({ url }) =>
          attachmentList(names, pageOf(url, "start"), pageOf(url, "limit")),
      },
    ]);

    const result = await confluenceCopyPage({
      params: { sourcePageId: "100", parentPageId: "300" },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result.success).toBe(true);
    expect(result.attachmentsCopied).toBe(205);
    const listings = calls.filter((c) => /child\/attachment/.test(c.url));
    expect(listings.map((c) => pageOf(c.url, "start"))).toEqual([
      0, 200, 0, 200,
    ]);
  });

  it("falls back to a verbatim v2 body copy when the native endpoint is not usable for the token", async () => {
    useRoutes([
      sourcePage,
      {
        method: "get",
        match: new RegExp(`${V1}/content/100/child/attachment`),
        respond: () => attachmentList(["logo.png"]),
      },
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: failWith(403, "Scopes don't match"),
      },
      {
        method: "get",
        match: new RegExp(`${V2}/spaces\\?keys=ENG`),
        respond: () => ({ data: { results: [{ id: "S9", key: "ENG" }] } }),
      },
      {
        method: "post",
        match: new RegExp(`${V2}/pages$`),
        respond: ({ data }) => {
          expect(data).toEqual({
            spaceId: "S9",
            status: "current",
            title: "Weekly Template",
            body: { representation: "storage", value: TEMPLATE_BODY },
          });
          return {
            data: {
              id: "900",
              title: "Weekly Template",
              version: { number: 1 },
              _links: { base: "https://x.atlassian.net/wiki", webui: "/p/900" },
            },
          };
        },
      },
    ]);

    const result = await confluenceCopyPage({
      params: { sourcePageId: "100", spaceKey: "ENG" },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result.success).toBe(true);
    expect(result.pageId).toBe("900");
    expect(result.pageUrl).toBe("https://x.atlassian.net/wiki/p/900");
    expect(result.attachmentsCopied).toBe(0);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings?.[0]).toMatch(/HTTP 403/);
    expect(result.warnings?.[1]).toMatch(/Attachments were not copied/);
  });

  it("falls back to a v2 PUT (next version) for an existing destination page", async () => {
    useRoutes([
      sourcePage,
      destinationPage,
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: failWith(404, "Not found"),
      },
      {
        method: "put",
        match: new RegExp(`${V2}/pages/200$`),
        respond: ({ data }) => {
          expect(data.version).toEqual({ number: 4 });
          expect(data.title).toBe("Week 38 Report");
          expect(data.body.value).toBe(TEMPLATE_BODY);
          return { data: { id: "200", version: { number: 4 } } };
        },
      },
    ]);

    const result = await confluenceCopyPage({
      params: {
        sourcePageId: "100",
        destinationPageId: "200",
        copyAttachments: false,
      },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result.success).toBe(true);
    expect(result.version).toBe(4);
    expect(result.warnings).toHaveLength(1);
  });

  it("surfaces a title conflict with Confluence's message and does not fall back", async () => {
    useRoutes([
      sourcePage,
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: failWith(
          400,
          "A page with this title already exists: Weekly Template",
        ),
      },
    ]);

    const result = await confluenceCopyPage({
      params: { sourcePageId: "100", spaceKey: "ENG", copyAttachments: false },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result).toEqual({
      success: false,
      error:
        "Request failed with status 400: A page with this title already exists: Weekly Template",
    });
    expect(
      calls.some(
        (c) => c.method === "post" && new RegExp(`${V2}/pages$`).test(c.url),
      ),
    ).toBe(false);
    expect(calls.filter((c) => c.method === "put")).toHaveLength(0);
  });

  it("refuses the fallback (without writing) when the source has no storage body, instead of writing an empty page", async () => {
    useRoutes([
      {
        method: "get",
        match: new RegExp(`${V2}/pages/100\\?body-format=storage`),
        respond: () => ({
          data: { id: "100", title: "Weekly Template", version: { number: 7 } },
        }),
      },
      destinationPage,
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: failWith(403, "Scopes don't match"),
      },
    ]);

    const result = await confluenceCopyPage({
      params: {
        sourcePageId: "100",
        destinationPageId: "200",
        copyAttachments: false,
      },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(
      /did not return a storage-format body for page 100/,
    );
    expect(calls.filter((c) => c.method === "put")).toHaveLength(0);
  });

  it("still copies natively when the v2 source read lacks a body, since the native copy does not use it", async () => {
    useRoutes([
      {
        method: "get",
        match: new RegExp(`${V2}/pages/100\\?body-format=storage`),
        respond: () => ({
          data: { id: "100", title: "Weekly Template", version: { number: 7 } },
        }),
      },
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: () => ({ data: { id: "301" } }),
      },
    ]);

    const result = await confluenceCopyPage({
      params: {
        sourcePageId: "100",
        parentPageId: "300",
        copyAttachments: false,
      },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result.success).toBe(true);
    expect(result.pageId).toBe("301");
  });

  it("gives up after repeated optimistic-lock conflicts without writing anything else", async () => {
    useRoutes([
      sourcePage,
      {
        method: "post",
        match: new RegExp(`${V1}/content/100/copy`),
        respond: failWith(409, "optimistic locking failed"),
      },
    ]);

    const result = await confluenceCopyPage({
      params: {
        sourcePageId: "100",
        parentPageId: "300",
        copyAttachments: false,
      },
      authParams: { authToken: "token", cloudId: "cloud-1" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/409/);
    expect(calls.filter((c) => c.method === "post")).toHaveLength(3);
  }, 10000);
});

describe("confluenceDataCenter copyPage", () => {
  const BASE = "https://confluence.example.com/rest/api";
  const authParams = {
    authToken: "token",
    baseUrl: "https://confluence.example.com/",
  };

  const sourcePage = (
    labels: { prefix?: string; name: string }[] = [],
  ): Route => ({
    method: "get",
    match: new RegExp(
      `${BASE}/content/100\\?expand=body.storage,version,metadata.labels`,
    ),
    respond: () => ({
      data: {
        id: "100",
        title: "Weekly Template",
        version: { number: 2 },
        body: { storage: { value: TEMPLATE_BODY } },
        metadata: { labels: { results: labels } },
      },
    }),
  });

  const download: Route = {
    method: "get",
    match: /\/download\/attachments\//,
    respond: ({ config }) => {
      expect(config.responseType).toBe("arraybuffer");
      return { data: Buffer.from("bytes") };
    },
  };

  it("copies onto an existing page, keeping its title, then copies labels and attachments", async () => {
    const uploads: { url: string; filename: string }[] = [];
    useRoutes([
      sourcePage([{ prefix: "global", name: "template" }, { name: "weekly" }]),
      {
        method: "get",
        match: new RegExp(`${BASE}/content/200\\?expand=version`),
        respond: () => ({
          data: { id: "200", title: "Week 38", version: { number: 5 } },
        }),
      },
      {
        method: "put",
        match: new RegExp(`${BASE}/content/200$`),
        respond: ({ data }) => {
          expect(data).toEqual({
            id: "200",
            type: "page",
            title: "Week 38",
            body: {
              storage: { value: TEMPLATE_BODY, representation: "storage" },
            },
            version: { number: 6 },
          });
          return {
            data: {
              id: "200",
              version: { number: 6 },
              _links: {
                base: "https://confluence.example.com",
                webui: "/pages/200",
              },
            },
          };
        },
      },
      {
        method: "post",
        match: new RegExp(`${BASE}/content/200/label`),
        respond: ({ data }) => {
          expect(data).toEqual([
            { prefix: "global", name: "template" },
            { prefix: "global", name: "weekly" },
          ]);
          return { data: {} };
        },
      },
      {
        method: "get",
        match: new RegExp(`${BASE}/content/100/child/attachment`),
        respond: () => ({
          data: {
            _links: { base: "https://confluence.example.com" },
            ...attachmentList(["logo.png", "data.csv"]).data,
          },
        }),
      },
      {
        // "logo.png" already exists on the destination and must be updated in place, not duplicated.
        method: "get",
        match: new RegExp(`${BASE}/content/200/child/attachment`),
        respond: () => ({
          data: {
            results: [
              { id: "old9", title: "logo.png", _links: { download: "/x" } },
            ],
          },
        }),
      },
      download,
      {
        method: "post",
        match: /child\/attachment/,
        respond: ({ url, data, config }) => {
          expect(data).toBeInstanceOf(FormData);
          expect(config.headers["X-Atlassian-Token"]).toBe("nocheck");
          expect(config.headers["Content-Type"]).toBeUndefined();
          uploads.push({ url, filename: (data.get("file") as File).name });
          return { data: {} };
        },
      },
    ]);

    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", destinationPageId: "200" },
      authParams,
    });

    expect(result).toEqual({
      success: true,
      pageId: "200",
      title: "Week 38",
      version: 6,
      pageUrl: "https://confluence.example.com/pages/200",
      attachmentsCopied: 2,
    });
    expect(uploads).toEqual([
      {
        url: `${BASE}/content/200/child/attachment/old9/data`,
        filename: "logo.png",
      },
      { url: `${BASE}/content/200/child/attachment`, filename: "data.csv" },
    ]);
  });

  it("creates a child page under the parent's space and reports a failed attachment as a warning", async () => {
    useRoutes([
      sourcePage(),
      {
        method: "get",
        match: new RegExp(`${BASE}/content/300\\?expand=space`),
        respond: () => ({ data: { id: "300", space: { key: "ENG" } } }),
      },
      {
        method: "post",
        match: new RegExp(`${BASE}/content$`),
        respond: ({ data }) => {
          expect(data).toEqual({
            type: "page",
            title: "Week 40",
            space: { key: "ENG" },
            ancestors: [{ id: "300" }],
            body: {
              storage: { value: TEMPLATE_BODY, representation: "storage" },
            },
          });
          return {
            data: { id: "401", title: "Week 40", version: { number: 1 } },
          };
        },
      },
      {
        method: "get",
        match: new RegExp(`${BASE}/content/100/child/attachment`),
        respond: () => attachmentList(["ok.png", "bad.png"]),
      },
      {
        method: "get",
        match: new RegExp(`${BASE}/content/401/child/attachment`),
        respond: () => ({ data: { results: [] } }),
      },
      {
        method: "get",
        match: /\/download\/attachments\/ok\.png/,
        respond: () => ({ data: Buffer.from("x") }),
      },
      {
        method: "get",
        match: /\/download\/attachments\/bad\.png/,
        respond: failWith(500, "boom"),
      },
      {
        method: "post",
        match: /child\/attachment$/,
        respond: () => ({ data: {} }),
      },
    ]);

    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", parentPageId: "300", title: "Week 40" },
      authParams,
    });

    expect(result.success).toBe(true);
    expect(result.pageId).toBe("401");
    expect(result.attachmentsCopied).toBe(1);
    expect(result.warnings).toEqual([
      'Attachment "bad.png" could not be copied: Request failed with status 500: boom',
    ]);
    expect(calls.some((c) => /\/label$/.test(c.url))).toBe(false);
  });

  it("paginates the source attachment listing", async () => {
    const names = Array.from({ length: 201 }, (_, i) => `file-${i}.bin`);
    useRoutes([
      sourcePage(),
      {
        method: "post",
        match: new RegExp(`${BASE}/content$`),
        respond: () => ({ data: { id: "500" } }),
      },
      {
        method: "get",
        match: new RegExp(`${BASE}/content/100/child/attachment`),
        respond: ({ url }) =>
          attachmentList(names, pageOf(url, "start"), pageOf(url, "limit")),
      },
      {
        method: "get",
        match: new RegExp(`${BASE}/content/500/child/attachment`),
        respond: () => ({ data: { results: [] } }),
      },
      download,
      {
        method: "post",
        match: /child\/attachment$/,
        respond: () => ({ data: {} }),
      },
    ]);

    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", spaceKey: "ENG", title: "Copy" },
      authParams,
    });

    expect(result.success).toBe(true);
    expect(result.attachmentsCopied).toBe(201);
    const sourceListings = calls.filter((c) =>
      new RegExp(`${BASE}/content/100/child/attachment`).test(c.url),
    );
    expect(sourceListings.map((c) => pageOf(c.url, "start"))).toEqual([0, 200]);
  });

  it("skips attachment handling entirely when copyAttachments is false", async () => {
    useRoutes([
      sourcePage(),
      {
        method: "post",
        match: new RegExp(`${BASE}/content$`),
        respond: () => ({ data: { id: "500" } }),
      },
    ]);

    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", spaceKey: "ENG", copyAttachments: false },
      authParams,
    });

    expect(result).toEqual({
      success: true,
      pageId: "500",
      title: "Weekly Template",
      version: undefined,
      pageUrl: undefined,
      attachmentsCopied: 0,
    });
    expect(calls.some((c) => /child\/attachment/.test(c.url))).toBe(false);
  });

  it("surfaces a failed body write with Confluence's message and does not touch labels or attachments", async () => {
    useRoutes([
      sourcePage([{ name: "template" }]),
      {
        method: "post",
        match: new RegExp(`${BASE}/content$`),
        respond: failWith(400, "A page with this title already exists"),
      },
    ]);

    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", spaceKey: "ENG" },
      authParams,
    });

    expect(result).toEqual({
      success: false,
      error:
        "Request failed with status 400: A page with this title already exists",
    });
    expect(calls.filter((c) => c.method === "post")).toHaveLength(1);
  });

  it("refuses to overwrite the destination when the source has no storage body", async () => {
    useRoutes([
      {
        method: "get",
        match: new RegExp(
          `${BASE}/content/100\\?expand=body.storage,version,metadata.labels`,
        ),
        respond: () => ({
          data: {
            id: "100",
            title: "Weekly Template",
            version: { number: 2 },
            body: {},
          },
        }),
      },
      {
        method: "get",
        match: new RegExp(`${BASE}/content/200\\?expand=version`),
        respond: () => ({
          data: { id: "200", title: "Week 38", version: { number: 5 } },
        }),
      },
    ]);

    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", destinationPageId: "200" },
      authParams,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(
      /did not return a storage-format body for page 100/,
    );
    expect(calls.filter((c) => c.method !== "get")).toHaveLength(0);
  });

  it("returns an error (without writing) when the base URL is missing", async () => {
    useRoutes([]);
    const result = await confluenceDataCenterCopyPage({
      params: { sourcePageId: "100", spaceKey: "ENG" },
      authParams: { authToken: "token" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Base URL is required/);
    expect(calls).toHaveLength(0);
  });
});
