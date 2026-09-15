import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockPut = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

import {
  applyConfluenceFragmentUpdates,
  locateTableRow,
} from "../../src/actions/util/confluenceStorageFormat";
import confluenceUpdatePageFragments from "../../src/actions/providers/confluence/updatePageFragments";
import confluenceDataCenterUpdatePageFragments from "../../src/actions/providers/confluenceDataCenter/updatePageFragments";

const USER_KEY = "2c96d7e295488cec0195b4c0a3890027";
const USER_MENTION = `<ac:link><ri:user ri:userkey="${USER_KEY}" /></ac:link>`;
const OTHER_USER_MENTION = `<ac:link><ri:user ri:userkey="ffffffffffffffffffffffffffffffff" /></ac:link>`;

// A trimmed-down version of the customer's weekly report: several sections, each with a table, the same
// user appearing in more than one section, a macro in a header, and a nested "Metrics" table inside a cell.
const PAGE_BODY = [
  `<h1>Project Summary</h1>`,
  `<p><ac:structured-macro ac:name="info"><ac:rich-text-body><p>Weekly report</p></ac:rich-text-body></ac:structured-macro></p>`,
  `<h2>Cloud/Infrastructure</h2>`,
  `<table><colgroup><col /><col /><col /></colgroup><tbody>`,
  `<tr><th><p>Name</p></th><th><p>Weekly Snapshot</p></th><th><p>Metrics</p></th></tr>`,
  `<tr><td><p>${USER_MENTION}</p></td><td><p>Cloud work TBD</p></td><td><p>n/a</p></td></tr>`,
  `</tbody></table>`,
  `<h2>Application Development</h2>`,
  `<h3>ServiceNow</h3>`,
  `<table><colgroup><col /><col /><col /><col /></colgroup><tbody>`,
  `<tr><th><p>Name</p></th><th><p>Weekly&nbsp;Snapshot</p></th><th><p>Planned Activities</p></th><th><p>Metrics</p></th></tr>`,
  `<tr><td><p>${OTHER_USER_MENTION}</p></td><td><p>Other user's snapshot</p></td><td><p>Other plans</p></td><td><p>-</p></td></tr>`,
  `<tr><td><p>${USER_MENTION}</p></td><td><p>Snapshot TBD</p></td><td><p>Plans TBD</p></td>`,
  `<td><table><tbody>`,
  `<tr><td><p># of Tickets Closed</p></td><td><p>0</p></td></tr>`,
  `<tr><td><p>Jira Stories Completed</p></td><td><p>0</p></td></tr>`,
  `</tbody></table></td></tr>`,
  `</tbody></table>`,
  `<h3>SharePoint</h3>`,
  `<p>Nothing to report.</p>`,
  `<h2>Risk | Issues</h2>`,
  `<p>None</p>`,
].join("");

const REQUIRED_MARKERS = [
  "Project Summary",
  "Cloud/Infrastructure",
  "Application Development",
  "ServiceNow",
  "SharePoint",
  "Risk | Issues",
  "Weekly&nbsp;Snapshot",
  "Planned Activities",
  "Metrics",
];

describe("applyConfluenceFragmentUpdates", () => {
  it("updates a single cell by row anchor + column header and preserves everything else", () => {
    const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
      tableCellUpdates: [
        {
          rowAnchor: USER_KEY,
          sectionAnchor: "<h3>ServiceNow</h3>",
          columnHeader: "Weekly Snapshot",
          newContent:
            "<p><strong>High level accomplishments</strong></p><ul><li>Closed 4 SCTASKs</li></ul>",
        },
      ],
      requiredMarkers: REQUIRED_MARKERS,
    });

    expect(result.cellsUpdated).toBe(1);
    expect(result.replacementsApplied).toBe(0);
    expect(result.body).toContain("<li>Closed 4 SCTASKs</li>");
    expect(result.body).not.toContain("Snapshot TBD");

    // Untouched fragments survive byte-for-byte.
    expect(result.body).toContain("Cloud work TBD");
    expect(result.body).toContain("Other user's snapshot");
    expect(result.body).toContain("Plans TBD");
    expect(result.body).toContain(`<ac:structured-macro ac:name="info">`);
    expect(result.body.match(/<table>/g)).toHaveLength(
      PAGE_BODY.match(/<table>/g)!.length,
    );
    expect(result.body.match(/<tr>/g)).toHaveLength(
      PAGE_BODY.match(/<tr>/g)!.length,
    );

    // Only the targeted cell changed: the body is identical outside of it.
    const [before, after] = PAGE_BODY.split("<p>Snapshot TBD</p>");
    expect(result.body.startsWith(before)).toBe(true);
    expect(result.body.endsWith(after)).toBe(true);
  });

  it("updates cells by zero-based column index and supports append/prepend modes", () => {
    const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
      tableCellUpdates: [
        {
          rowAnchor: USER_KEY,
          sectionAnchor: "ServiceNow",
          columnIndex: 2,
          newContent: "<p>More</p>",
          mode: "append",
        },
        {
          rowAnchor: USER_KEY,
          sectionAnchor: "ServiceNow",
          columnIndex: 1,
          newContent: "<p>First</p>",
          mode: "prepend",
        },
      ],
    });

    expect(result.cellsUpdated).toBe(2);
    expect(result.body).toContain("<td><p>Plans TBD</p><p>More</p></td>");
    expect(result.body).toContain("<td><p>First</p><p>Snapshot TBD</p></td>");
  });

  it("targets a row inside a nested table without touching the outer row", () => {
    const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
      tableCellUpdates: [
        {
          rowAnchor: "# of Tickets Closed",
          columnIndex: 1,
          newContent: "<p>4</p>",
        },
        {
          rowAnchor: "Jira Stories Completed",
          columnIndex: 1,
          newContent: "<p>2</p>",
        },
      ],
    });

    expect(result.body).toContain(
      "<tr><td><p># of Tickets Closed</p></td><td><p>4</p></td></tr>",
    );
    expect(result.body).toContain(
      "<tr><td><p>Jira Stories Completed</p></td><td><p>2</p></td></tr>",
    );
    expect(result.body).toContain("<p>Snapshot TBD</p>");
  });

  it("scopes exact-text replacements to a row when rowAnchor is given", () => {
    const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
      replacements: [
        {
          find: "<p>0</p>",
          replace: "<p>4</p>",
          rowAnchor: "# of Tickets Closed",
        },
      ],
    });

    expect(result.replacementsApplied).toBe(1);
    expect(result.body).toContain(
      "<td><p># of Tickets Closed</p></td><td><p>4</p></td>",
    );
    // The other "0" (Jira Stories Completed) is untouched.
    expect(result.body).toContain(
      "<td><p>Jira Stories Completed</p></td><td><p>0</p></td>",
    );
  });

  it("supports replaceAll and reports how many occurrences were replaced", () => {
    const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
      replacements: [{ find: "TBD", replace: "Done", replaceAll: true }],
    });

    expect(result.replacementsApplied).toBe(3);
    expect(result.body).not.toContain("TBD");
  });

  it("fails without changing anything when the same rowAnchor matches multiple tables and no sectionAnchor is given", () => {
    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            columnHeader: "Weekly Snapshot",
            newContent: "<p>x</p>",
          },
        ],
      }),
    ).toThrow(/matched 2 table rows.*sectionAnchor/);
  });

  it("uses the first matching row after the sectionAnchor when the user appears in several sections", () => {
    const cloudRow = locateTableRow(
      PAGE_BODY,
      USER_KEY,
      "Cloud/Infrastructure",
    );
    const snowRow = locateTableRow(PAGE_BODY, USER_KEY, "ServiceNow");
    expect(PAGE_BODY.slice(cloudRow.start, cloudRow.end)).toContain(
      "Cloud work TBD",
    );
    expect(PAGE_BODY.slice(snowRow.start, snowRow.end)).toContain(
      "Snapshot TBD",
    );
  });

  it("fails when the row, section, column header or find text cannot be located", () => {
    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          { rowAnchor: "nobody-here", columnIndex: 1, newContent: "<p>x</p>" },
        ],
      }),
    ).toThrow(/No table row containing rowAnchor "nobody-here"/);

    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "PowerBI",
            columnIndex: 1,
            newContent: "<p>x</p>",
          },
        ],
      }),
    ).toThrow(/sectionAnchor "PowerBI" was not found/);

    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "ServiceNow",
            columnHeader: "Executive Inputs",
            newContent: "<p>x</p>",
          },
        ],
      }),
    ).toThrow(
      /No column with header "Executive Inputs".*Available headers: "name", "weekly snapshot"/,
    );

    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "ServiceNow",
            columnIndex: 9,
            newContent: "<p>x</p>",
          },
        ],
      }),
    ).toThrow(/has 4 cell\(s\); columnIndex 9 is out of range/);

    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: "does not exist", replace: "x" }],
      }),
    ).toThrow(/"does not exist" was not found in the page body/);

    expect(() => applyConfluenceFragmentUpdates(PAGE_BODY, {})).toThrow(
      /At least one/,
    );
  });

  it("refuses to save when a required marker would go missing", () => {
    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: "<h3>SharePoint</h3>", replace: "" }],
        requiredMarkers: REQUIRED_MARKERS,
      }),
    ).toThrow(/missing required marker\(s\): "SharePoint"/);
  });

  it("refuses to save when an edit would drop tables or rows", () => {
    const nestedTable = PAGE_BODY.slice(
      PAGE_BODY.indexOf("<table><tbody><tr><td><p># of"),
      PAGE_BODY.indexOf("</table></td></tr>") + "</table>".length,
    );
    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: nestedTable, replace: "<p>gone</p>" }],
      }),
    ).toThrow(/would reduce the page from 3 table\(s\)/);
  });
});

describe("confluence updatePageFragments (Cloud)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches the page server-side, applies edits and PUTs the full body with an incremented version", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("accessible-resources"))
        return { data: [{ id: "cloud-123" }] };
      return {
        data: {
          title: "Weekly Report",
          version: { number: 7 },
          body: { storage: { value: PAGE_BODY } },
        },
      };
    });
    mockPut.mockResolvedValue({ data: {} });

    const result = await confluenceUpdatePageFragments({
      params: {
        pageId: "193957299",
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "ServiceNow",
            columnHeader: "Weekly Snapshot",
            newContent: "<p>Closed 4 tickets</p>",
          },
        ],
        replacements: [
          {
            find: "<p>0</p>",
            replace: "<p>4</p>",
            rowAnchor: "# of Tickets Closed",
          },
        ],
        requiredMarkers: REQUIRED_MARKERS,
      },
      authParams: { authToken: "token" },
    });

    expect(result).toEqual({
      success: true,
      pageId: "193957299",
      title: "Weekly Report",
      version: 8,
      cellsUpdated: 1,
      replacementsApplied: 1,
    });

    expect(mockPut).toHaveBeenCalledTimes(1);
    const [url, payload, config] = mockPut.mock.calls[0];
    expect(url).toBe("/pages/193957299");
    expect(config.baseURL).toBe(
      "https://api.atlassian.com/ex/confluence/cloud-123/api/v2",
    );
    expect(payload.title).toBe("Weekly Report");
    expect(payload.version.number).toBe(8);
    expect(payload.body.representation).toBe("storage");
    expect(payload.body.value).toContain("<p>Closed 4 tickets</p>");
    expect(payload.body.value).toContain("Other user's snapshot");
    expect(payload.body.value).toContain(
      "<td><p># of Tickets Closed</p></td><td><p>4</p></td>",
    );
  });

  it("does not write to Confluence when an edit cannot be applied", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("accessible-resources"))
        return { data: [{ id: "cloud-123" }] };
      return {
        data: {
          title: "Weekly Report",
          version: { number: 7 },
          body: { storage: { value: PAGE_BODY } },
        },
      };
    });

    const result = await confluenceUpdatePageFragments({
      params: {
        pageId: "193957299",
        tableCellUpdates: [
          { rowAnchor: "missing user", columnIndex: 1, newContent: "<p>x</p>" },
        ],
      },
      authParams: { authToken: "token" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(
      /No table row containing rowAnchor "missing user"/,
    );
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("throws when no auth token is provided", async () => {
    await expect(
      confluenceUpdatePageFragments({
        params: { pageId: "1", replacements: [{ find: "a", replace: "b" }] },
        authParams: {},
      }),
    ).rejects.toThrow();
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe("confluenceDataCenter updatePageFragments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the Data Center REST API shape", async () => {
    mockGet.mockResolvedValue({
      data: {
        title: "Weekly Report",
        version: { number: 3 },
        body: { storage: { value: PAGE_BODY } },
      },
    });
    mockPut.mockResolvedValue({ data: {} });

    const result = await confluenceDataCenterUpdatePageFragments({
      params: {
        pageId: "42",
        replacements: [
          { find: "Nothing to report.", replace: "Migration complete." },
        ],
      },
      authParams: {
        authToken: "token",
        baseUrl: "https://confluence.example.com/",
      },
    });

    expect(result.success).toBe(true);
    expect(result.version).toBe(4);
    expect(mockGet).toHaveBeenCalledWith(
      "https://confluence.example.com/rest/api/content/42?expand=body.storage,version",
      expect.anything(),
    );
    const [url, payload] = mockPut.mock.calls[0];
    expect(url).toBe("https://confluence.example.com/rest/api/content/42");
    expect(payload.type).toBe("page");
    expect(payload.version.number).toBe(4);
    expect(payload.body.storage.value).toContain("Migration complete.");
    expect(payload.body.storage.value).not.toContain("Nothing to report.");
  });

  it("returns an error (without writing) when the base URL is missing", async () => {
    const result = await confluenceDataCenterUpdatePageFragments({
      params: { pageId: "42", replacements: [{ find: "a", replace: "b" }] },
      authParams: { authToken: "token" },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Base URL is required/);
    expect(mockPut).not.toHaveBeenCalled();
  });
});
