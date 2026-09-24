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
import { confluenceUpdatePageFragmentsParamsSchema } from "../../src/actions/autogen/types";
import type { confluenceUpdatePageFragmentsParamsType } from "../../src/actions/autogen/types";
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

  it("refuses a replacement that would remove a whole nested table", () => {
    const nestedTable = PAGE_BODY.slice(
      PAGE_BODY.indexOf("<table><tbody><tr><td><p># of"),
      PAGE_BODY.indexOf("</table></td></tr>") + "</table>".length,
    );
    expect(() =>
      applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: nestedTable, replace: "<p>gone</p>" }],
      }),
    ).toThrow(/would alter table structure/);
  });

  describe("structural safety (Issue 1)", () => {
    it("rejects a replacement that merges two cells by deleting a </td><td> boundary", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [
            {
              find: "</td><td><p>Snapshot TBD</p>",
              replace: "<p>Snapshot TBD</p>",
            },
          ],
        }),
      ).toThrow(/would change the tag structure/);

      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [{ find: "</td><td>", replace: "" }],
        }),
      ).toThrow(
        /would change the tag structure.*stray <\/td>, unclosed <td>.*balanced/,
      );
    });

    it("rejects a replacement that keeps the signature but removes a cell", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [{ find: "<td><p>Plans TBD</p></td>", replace: "" }],
        }),
      ).toThrow(/would alter table structure/);
    });

    it("rejects newContent that injects or closes cells, or is not well-formed", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            {
              rowAnchor: "# of Tickets Closed",
              columnIndex: 1,
              newContent: "<p>4</p></td><td><p>extra</p>",
            },
          ],
        }),
      ).toThrow(/newContent is not well-formed XHTML/);

      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            {
              rowAnchor: "# of Tickets Closed",
              columnIndex: 1,
              newContent: "<td><p>4</p></td>",
            },
          ],
        }),
      ).toThrow(/contains <td> outside of a complete nested <table>/);

      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            {
              rowAnchor: "# of Tickets Closed",
              columnIndex: 1,
              newContent: "<p>4",
            },
          ],
        }),
      ).toThrow(/unclosed <p>/);
    });

    it("still allows inserting a complete nested table and self-closing tags", () => {
      const nested =
        "<p>Summary<br /></p><table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table>";
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "Cloud/Infrastructure",
            columnIndex: 2,
            newContent: nested,
          },
        ],
        replacements: [
          {
            find: "<p>Nothing to report.</p>",
            replace: "<table><tbody><tr><td>x</td></tr></tbody></table>",
          },
        ],
      });
      expect(result.body).toContain(nested);
      expect(result.body).toContain("<tr><td>x</td></tr>");
    });

    it("allows replacements that change attributes but not structure, and unbalanced-but-matching text", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "<td><p>Plans TBD</p></td>",
            replace: '<td class="highlight"><p>Plans TBD</p></td>',
          },
          { find: "<p>Nothing to", replace: "<p>Something to" },
        ],
      });
      expect(result.body).toContain(
        '<td class="highlight"><p>Plans TBD</p></td>',
      );
      expect(result.body).toContain("<p>Something to report.</p>");
    });
  });

  describe("tags with '>' inside quoted attributes", () => {
    const ATTACHMENT = `<ac:link><ri:attachment ri:filename="a>b.png" /></ac:link>`;

    it("accepts self-closing tags whose attribute values contain '>'", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "<h3>ServiceNow</h3>",
            columnHeader: "Weekly Snapshot",
            newContent: `<p>See ${ATTACHMENT}</p>`,
          },
        ],
        replacements: [
          {
            find: "<p>Nothing to report.</p>",
            replace: `<p>${ATTACHMENT}</p>`,
          },
        ],
      });
      expect(result.body).toContain(`<td><p>See ${ATTACHMENT}</p></td>`);
      expect(result.body).toContain(`<p>${ATTACHMENT}</p>`);
    });

    it("locates rows, cells and headers correctly when their own attributes contain '>'", () => {
      const page = [
        `<table><tbody>`,
        `<tr><th data-note="x>y"><p>Name</p></th><th title='a>b'><p>Score</p></th></tr>`,
        `<tr data-id="r>1"><td data-cell="c>1"><p>Jane</p></td><td><p>0</p></td></tr>`,
        `</tbody></table>`,
      ].join("");
      const result = applyConfluenceFragmentUpdates(page, {
        tableCellUpdates: [
          { rowAnchor: "Jane", columnHeader: "Score", newContent: "<p>5</p>" },
        ],
      });
      expect(result.body).toBe(
        page.replace("<td><p>0</p></td>", "<td><p>5</p></td>"),
      );
    });
  });

  describe("section scoping (Issue 2)", () => {
    // "ServiceNow" is mentioned in the summary paragraph before the Cloud table, and again as the heading.
    const PAGE_WITH_REPEATED_ANCHOR = PAGE_BODY.replace(
      "<p>Weekly report</p>",
      "<p>Weekly report covering ServiceNow and cloud</p>",
    );

    it("rejects an anchor that resolves to multiple tables containing the row instead of picking the first", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_WITH_REPEATED_ANCHOR, {
          tableCellUpdates: [
            {
              rowAnchor: USER_KEY,
              sectionAnchor: "ServiceNow",
              columnIndex: 1,
              newContent: "<p>x</p>",
            },
          ],
        }),
      ).toThrow(
        /occurs 2 times.*matches rows in 2 different tables.*<h3>ServiceNow<\/h3>/,
      );
    });

    it("works when the anchor is made specific enough", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_WITH_REPEATED_ANCHOR, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "<h3>ServiceNow</h3>",
            columnIndex: 1,
            newContent: "<p>x</p>",
          },
        ],
      });
      expect(result.body).toContain(
        "<td><p>x</p></td><td><p>Plans TBD</p></td>",
      );
      expect(result.body).toContain("Cloud work TBD");
    });

    it("still rejects duplicates within the single section table", () => {
      const duplicated = PAGE_BODY.replace(
        `<tr><td><p>${OTHER_USER_MENTION}</p></td>`,
        `<tr><td><p>${USER_MENTION}</p></td>`,
      );
      expect(() =>
        applyConfluenceFragmentUpdates(duplicated, {
          tableCellUpdates: [
            {
              rowAnchor: USER_KEY,
              sectionAnchor: "<h3>ServiceNow</h3>",
              columnIndex: 1,
              newContent: "<p>x</p>",
            },
          ],
        }),
      ).toThrow(/matched 2 rows in the table identified by sectionAnchor/);
    });

    it("scopes to the table containing the anchor when the anchor sits inside the table", () => {
      // Anchor on the user key: it occurs in two tables, but only the ServiceNow one has the nested metrics row.
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: "# of Tickets Closed",
            sectionAnchor: USER_KEY,
            columnIndex: 1,
            newContent: "<p>4</p>",
          },
        ],
      });
      expect(result.body).toContain(
        "<td><p># of Tickets Closed</p></td><td><p>4</p></td>",
      );
    });

    it("fails when there is no table after the anchor", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            {
              rowAnchor: USER_KEY,
              sectionAnchor: "Risk | Issues",
              columnIndex: 1,
              newContent: "<p>x</p>",
            },
          ],
        }),
      ).toThrow(/no table at or after it/);
    });
  });

  describe("occurrence targeting", () => {
    // "TBD" appears three times on the page, in document order: Cloud work, Snapshot, Plans.
    it("replaces only the Nth occurrence of find when occurrence is given", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: "TBD", replace: "Done", occurrence: 1 }],
      });
      expect(result.replacementsApplied).toBe(1);
      expect(result.body).toContain("Cloud work TBD");
      expect(result.body).toContain("Snapshot Done");
      expect(result.body).toContain("Plans TBD");
    });

    it("treats occurrence 0 exactly like the default first-match behaviour", () => {
      const withOccurrence = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: "TBD", replace: "Done", occurrence: 0 }],
      });
      const withoutOccurrence = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [{ find: "TBD", replace: "Done" }],
      });
      expect(withOccurrence.body).toBe(withoutOccurrence.body);
    });

    it("counts occurrences within the scope, not the whole page", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "TBD",
            replace: "Done",
            sectionAnchor: "<h3>ServiceNow</h3>",
            occurrence: 1,
          },
        ],
      });
      // Within the ServiceNow section the second "TBD" is "Plans TBD".
      expect(result.body).toContain("Cloud work TBD");
      expect(result.body).toContain("Snapshot TBD");
      expect(result.body).toContain("Plans Done");
    });

    it("rejects an out-of-range occurrence without changing anything", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [{ find: "TBD", replace: "Done", occurrence: 5 }],
        }),
      ).toThrow(
        /occurs 3 time\(s\) in the page body; occurrence 5 is out of range/,
      );
    });

    it("rejects occurrence combined with replaceAll, and negative or fractional occurrences", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [
            { find: "TBD", replace: "Done", occurrence: 1, replaceAll: true },
          ],
        }),
      ).toThrow(/either occurrence or replaceAll, not both/);
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [{ find: "TBD", replace: "Done", occurrence: -1 }],
        }),
      ).toThrow(/occurrence must be a non-negative integer/);
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [{ find: "TBD", replace: "Done", occurrence: 1.5 }],
        }),
      ).toThrow(/occurrence must be a non-negative integer/);
    });

    it("selects among duplicate rowAnchor matches with rowOccurrence (no sectionAnchor)", () => {
      // USER_KEY appears in the Cloud table (row 0) and the ServiceNow table (row 1).
      const first = applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            rowOccurrence: 0,
            columnIndex: 1,
            newContent: "<p>x</p>",
          },
        ],
      });
      expect(first.body).not.toContain("Cloud work TBD");
      expect(first.body).toContain("Snapshot TBD");

      const second = applyConfluenceFragmentUpdates(PAGE_BODY, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            rowOccurrence: 1,
            columnIndex: 1,
            newContent: "<p>x</p>",
          },
        ],
      });
      expect(second.body).toContain("Cloud work TBD");
      expect(second.body).not.toContain("Snapshot TBD");
      expect(second.body).toContain(
        "<td><p>x</p></td><td><p>Plans TBD</p></td>",
      );
    });

    it("selects among duplicate rows inside a section table with rowOccurrence", () => {
      const duplicated = PAGE_BODY.replace(
        `<tr><td><p>${OTHER_USER_MENTION}</p></td>`,
        `<tr><td><p>${USER_MENTION}</p></td>`,
      );
      const result = applyConfluenceFragmentUpdates(duplicated, {
        tableCellUpdates: [
          {
            rowAnchor: USER_KEY,
            sectionAnchor: "<h3>ServiceNow</h3>",
            rowOccurrence: 1,
            columnIndex: 1,
            newContent: "<p>x</p>",
          },
        ],
      });
      expect(result.body).toContain("Other user's snapshot");
      expect(result.body).not.toContain("Snapshot TBD");
      expect(result.body).toContain("Cloud work TBD");
    });

    it("scopes a replacement to the rowOccurrence-th matching row", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "TBD",
            replace: "Done",
            rowAnchor: USER_KEY,
            rowOccurrence: 0,
          },
        ],
      });
      expect(result.body).toContain("Cloud work Done");
      expect(result.body).toContain("Snapshot TBD");
    });

    it("rejects an out-of-range rowOccurrence", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            {
              rowAnchor: USER_KEY,
              rowOccurrence: 2,
              columnIndex: 1,
              newContent: "<p>x</p>",
            },
          ],
        }),
      ).toThrow(
        /matched 2 table row\(s\) on the page; rowOccurrence 2 is out of range/,
      );
    });

    it("still rejects ambiguous rowAnchors when rowOccurrence is omitted", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            { rowAnchor: USER_KEY, columnIndex: 1, newContent: "<p>x</p>" },
          ],
        }),
      ).toThrow(/matched 2 table rows.*rowOccurrence/);
    });

    it("rejects rowOccurrence on a replacement that has no rowAnchor instead of ignoring it", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [{ find: "TBD", replace: "Done", rowOccurrence: 1 }],
        }),
      ).toThrow(/rowOccurrence requires a rowAnchor/);
    });

    describe("index parameters arriving as strings", () => {
      // invokeAction validates with the (coercing) Zod schema but passes the *original* params through, so
      // LLM-emitted numeric strings reach the util layer untouched and must be handled here.
      const asNumber = (value: string) => value as unknown as number;

      it("accepts digit-only strings for columnIndex, rowOccurrence and occurrence", () => {
        const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
          tableCellUpdates: [
            {
              rowAnchor: USER_KEY,
              rowOccurrence: asNumber("1"),
              columnIndex: asNumber("1"),
              newContent: "<p>x</p>",
            },
          ],
          replacements: [
            { find: "TBD", replace: "Done", occurrence: asNumber(" 1 ") },
          ],
        });
        // rowOccurrence "1" + columnIndex "1" → the ServiceNow row's Snapshot cell.
        expect(result.body).not.toContain("Snapshot TBD");
        // After the cell edit the remaining TBDs are "Cloud work TBD" (0) and "Plans TBD" (1).
        expect(result.body).toContain(
          "<td><p>x</p></td><td><p>Plans Done</p></td>",
        );
        expect(result.body).toContain("Cloud work TBD");
      });

      it("rejects empty, non-numeric, negative and fractional strings rather than coercing them to 0", () => {
        for (const bad of ["", " ", "abc", "-1", "1.5", "1e2"]) {
          expect(() =>
            applyConfluenceFragmentUpdates(PAGE_BODY, {
              tableCellUpdates: [
                {
                  rowAnchor: USER_KEY,
                  rowOccurrence: asNumber(bad),
                  columnIndex: 1,
                  newContent: "<p>x</p>",
                },
              ],
            }),
          ).toThrow(/rowOccurrence must be a non-negative integer/);
          expect(() =>
            applyConfluenceFragmentUpdates(PAGE_BODY, {
              replacements: [
                { find: "TBD", replace: "Done", occurrence: asNumber(bad) },
              ],
            }),
          ).toThrow(/occurrence must be a non-negative integer/);
        }
        expect(() =>
          applyConfluenceFragmentUpdates(PAGE_BODY, {
            tableCellUpdates: [
              {
                rowAnchor: "# of Tickets Closed",
                columnIndex: asNumber(""),
                newContent: "<p>x</p>",
              },
            ],
          }),
        ).toThrow(/columnIndex must be a non-negative integer/);
      });
    });
  });

  describe("section-bounded replacements (sectionEndAnchor)", () => {
    it("limits replaceAll to the text between sectionAnchor and sectionEndAnchor", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "TBD",
            replace: "Done",
            replaceAll: true,
            sectionAnchor: "<h3>ServiceNow</h3>",
            sectionEndAnchor: "<h3>SharePoint</h3>",
          },
        ],
      });
      expect(result.replacementsApplied).toBe(2);
      expect(result.body).toContain("Cloud work TBD");
      expect(result.body).toContain("Snapshot Done");
      expect(result.body).toContain("Plans Done");
    });

    it("supports a generic end anchor such as the next heading tag, searched after the start anchor", () => {
      // "<h2>" is a prefix of the sectionAnchor itself; the end anchor must be looked up past it.
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "TBD",
            replace: "Done",
            replaceAll: true,
            sectionAnchor: "<h2>Cloud/Infrastructure</h2>",
            sectionEndAnchor: "<h2>",
          },
        ],
      });
      expect(result.replacementsApplied).toBe(1);
      expect(result.body).toContain("Cloud work Done");
      expect(result.body).toContain("Snapshot TBD");
      expect(result.body).toContain("Plans TBD");
    });

    it("bounds the scope from the start of the page when only sectionEndAnchor is given", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "TBD",
            replace: "Done",
            replaceAll: true,
            sectionEndAnchor: "<h2>Application Development</h2>",
          },
        ],
      });
      expect(result.replacementsApplied).toBe(1);
      expect(result.body).toContain("Cloud work Done");
      expect(result.body).toContain("Snapshot TBD");
    });

    it("does not touch text that sits inside the end anchor itself", () => {
      // The end anchor is exclusive: "Risk | Issues" is not part of the scope.
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [
            {
              find: "Risk | Issues",
              replace: "Risks",
              sectionAnchor: "<h3>SharePoint</h3>",
              sectionEndAnchor: "<h2>Risk | Issues</h2>",
            },
          ],
        }),
      ).toThrow(
        /not found in the page body between sectionAnchor "<h3>SharePoint<\/h3>" and sectionEndAnchor/,
      );
    });

    it("fails when sectionEndAnchor does not occur after sectionAnchor", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [
            {
              find: "Nothing to report.",
              replace: "All good.",
              sectionAnchor: "<h3>SharePoint</h3>",
              sectionEndAnchor: "<h2>Cloud/Infrastructure</h2>",
            },
          ],
        }),
      ).toThrow(
        /sectionEndAnchor "<h2>Cloud\/Infrastructure<\/h2>" was not found after sectionAnchor/,
      );
    });

    it("rejects an empty sectionEndAnchor instead of silently widening the scope to the rest of the page", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [
            {
              find: "TBD",
              replace: "Done",
              replaceAll: true,
              sectionAnchor: "<h3>ServiceNow</h3>",
              sectionEndAnchor: "",
            },
          ],
        }),
      ).toThrow(/sectionEndAnchor must be a non-empty string/);
    });

    it("rejects sectionEndAnchor combined with rowAnchor", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_BODY, {
          replacements: [
            {
              find: "TBD",
              replace: "Done",
              rowAnchor: USER_KEY,
              sectionEndAnchor: "<h2>",
            },
          ],
        }),
      ).toThrow(/sectionEndAnchor cannot be combined with rowAnchor/);
    });

    it("leaves the open-ended default untouched when sectionEndAnchor is omitted", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_BODY, {
        replacements: [
          {
            find: "TBD",
            replace: "Done",
            replaceAll: true,
            sectionAnchor: "<h3>ServiceNow</h3>",
          },
        ],
      });
      // Both ServiceNow TBDs are replaced; nothing before the anchor is.
      expect(result.replacementsApplied).toBe(2);
      expect(result.body).toContain("Cloud work TBD");
    });
  });

  describe("merged header cells (Issue 3)", () => {
    const SPANNED_TABLE = [
      `<h2>Metrics</h2>`,
      `<table><tbody>`,
      `<tr><th colspan="2"><p>Person</p></th><th><p>Tickets</p></th><th><p>Stories</p></th></tr>`,
      `<tr><td><p>Jane</p></td><td><p>Doe</p></td><td><p>0</p></td><td><p>0</p></td></tr>`,
      `<tr><td colspan="2"><p>John Smith</p></td><td><p>1</p></td><td><p>1</p></td></tr>`,
      `</tbody></table>`,
    ].join("");

    it("maps a header after a colspan to the correct logical column", () => {
      const result = applyConfluenceFragmentUpdates(SPANNED_TABLE, {
        tableCellUpdates: [
          {
            rowAnchor: "Jane",
            columnHeader: "Tickets",
            newContent: "<p>7</p>",
          },
          {
            rowAnchor: "John Smith",
            columnHeader: "Stories",
            newContent: "<p>9</p>",
          },
        ],
      });
      expect(result.body).toContain(
        "<td><p>Jane</p></td><td><p>Doe</p></td><td><p>7</p></td><td><p>0</p></td>",
      );
      expect(result.body).toContain(
        '<td colspan="2"><p>John Smith</p></td><td><p>1</p></td><td><p>9</p></td>',
      );
    });

    it("rejects a header that itself spans multiple columns", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(SPANNED_TABLE, {
          tableCellUpdates: [
            {
              rowAnchor: "Jane",
              columnHeader: "Person",
              newContent: "<p>x</p>",
            },
          ],
        }),
      ).toThrow(/spans 2 columns.*Use columnIndex/);
    });

    it("rejects header lookup in tables that use rowspan", () => {
      const rowspanTable = SPANNED_TABLE.replace(
        `<td><p>Jane</p></td>`,
        `<td rowspan="2"><p>Jane</p></td>`,
      );
      expect(() =>
        applyConfluenceFragmentUpdates(rowspanTable, {
          tableCellUpdates: [
            {
              rowAnchor: "John Smith",
              columnHeader: "Tickets",
              newContent: "<p>x</p>",
            },
          ],
        }),
      ).toThrow(/uses rowspan.*Use columnIndex/);
    });
  });

  describe("code blocks (CDATA) and comments are opaque to the locator", () => {
    const CODE_SAMPLE =
      `<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[` +
      `<table><tbody><tr><td>Jane</td><td>example</td></tr></tbody></table>` +
      `]]></ac:plain-text-body></ac:structured-macro>`;
    const PAGE_WITH_CODE = [
      `<h2>Example markup</h2>`,
      CODE_SAMPLE,
      `<!-- <tr><td>Jane</td><td>commented out</td></tr> -->`,
      `<h2>People</h2>`,
      `<table><tbody>`,
      `<tr><th><p>Name</p></th><th><p>Score</p></th></tr>`,
      `<tr><td><p>Jane</p></td><td><p>0</p></td></tr>`,
      `</tbody></table>`,
    ].join("");

    it("ignores phantom rows inside CDATA/comments and edits the real row", () => {
      const result = applyConfluenceFragmentUpdates(PAGE_WITH_CODE, {
        tableCellUpdates: [
          { rowAnchor: "Jane", columnHeader: "Score", newContent: "<p>9</p>" },
        ],
      });
      expect(result.body).toBe(
        PAGE_WITH_CODE.replace("<td><p>0</p></td>", "<td><p>9</p></td>"),
      );
      expect(result.body).toContain(CODE_SAMPLE); // code sample untouched byte-for-byte
    });

    it("refuses to edit when the anchor only exists inside a code block", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE_WITH_CODE, {
          tableCellUpdates: [
            { rowAnchor: "example", columnIndex: 0, newContent: "<p>x</p>" },
          ],
        }),
      ).toThrow(/No table row containing rowAnchor "example"/);
    });
  });

  describe("self-closed empty cells", () => {
    const PAGE = [
      `<table><tbody>`,
      `<tr><th><p>Name</p></th><th><p>Snapshot</p></th><th/></tr>`,
      `<tr><td><p>Jane</p></td><td class="empty" /><td><p>tail</p></td></tr>`,
      `</tbody></table>`,
    ].join("");

    it("expands <td/> into <td>content</td> instead of inserting a sibling", () => {
      const result = applyConfluenceFragmentUpdates(PAGE, {
        tableCellUpdates: [
          {
            rowAnchor: "Jane",
            columnHeader: "Snapshot",
            newContent: "<p>Filled</p>",
          },
        ],
      });
      expect(result.body).toBe(
        PAGE.replace(
          `<td class="empty" />`,
          `<td class="empty"><p>Filled</p></td>`,
        ),
      );
    });

    it("handles append mode and <th/> cells the same way", () => {
      const result = applyConfluenceFragmentUpdates(PAGE, {
        tableCellUpdates: [
          {
            rowAnchor: "Jane",
            columnIndex: 1,
            newContent: "<p>A</p>",
            mode: "append",
          },
          {
            rowAnchor: "<th><p>Name</p></th>",
            columnIndex: 2,
            newContent: "<p>Extra</p>",
          },
        ],
      });
      expect(result.body).toContain(
        `<td class="empty"><p>A</p></td><td><p>tail</p></td>`,
      );
      expect(result.body).toContain(
        `<th><p>Snapshot</p></th><th><p>Extra</p></th></tr>`,
      );
    });
  });

  describe("replacements may not change colspan/rowspan", () => {
    const PAGE = `<table><tbody><tr><td colspan="2"><p>John Smith</p></td><td><p>1</p></td></tr></tbody></table>`;

    it("rejects dropping or changing a colspan", () => {
      expect(() =>
        applyConfluenceFragmentUpdates(PAGE, {
          replacements: [
            {
              find: `<td colspan="2"><p>John Smith</p></td>`,
              replace: `<td><p>John Smith</p></td>`,
            },
          ],
        }),
      ).toThrow(/would change colspan of a <td> from 2 to 1/);

      expect(() =>
        applyConfluenceFragmentUpdates(PAGE, {
          replacements: [
            { find: `<td colspan="2">`, replace: `<td colspan="3">` },
          ],
        }),
      ).toThrow(/would change colspan of a <td> from 2 to 3/);

      expect(() =>
        applyConfluenceFragmentUpdates(PAGE, {
          replacements: [
            {
              find: `<td><p>1</p></td>`,
              replace: `<td rowspan="2"><p>1</p></td>`,
            },
          ],
        }),
      ).toThrow(/would change rowspan of a <td> from 1 to 2/);
    });

    it("is not fooled by prefixed attributes such as data-colspan", () => {
      const prefixed = `<table><tbody><tr><td data-colspan="2" colspan="2"><p>a</p></td><td><p>b</p></td></tr></tbody></table>`;
      expect(() =>
        applyConfluenceFragmentUpdates(prefixed, {
          replacements: [
            {
              find: `<td data-colspan="2" colspan="2">`,
              replace: `<td data-colspan="2" colspan="1">`,
            },
          ],
        }),
      ).toThrow(/would change colspan of a <td> from 2 to 1/);

      // A data-colspan without a real colspan is a span of 1 for header mapping purposes.
      const headerPage = [
        `<table><tbody>`,
        `<tr><th data-colspan="3"><p>Name</p></th><th><p>Score</p></th></tr>`,
        `<tr><td><p>Jane</p></td><td><p>0</p></td></tr>`,
        `</tbody></table>`,
      ].join("");
      const result = applyConfluenceFragmentUpdates(headerPage, {
        tableCellUpdates: [
          { rowAnchor: "Jane", columnHeader: "Score", newContent: "<p>9</p>" },
        ],
      });
      expect(result.body).toBe(
        headerPage.replace("<td><p>0</p></td>", "<td><p>9</p></td>"),
      );
    });

    it("still allows other attribute changes on structural tags", () => {
      const result = applyConfluenceFragmentUpdates(PAGE, {
        replacements: [
          {
            find: `<td colspan="2">`,
            replace: `<td colspan="2" class="highlight">`,
          },
        ],
      });
      expect(result.body).toContain(
        `<td colspan="2" class="highlight"><p>John Smith</p></td>`,
      );
    });
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

  it("accepts the occurrence / rowOccurrence / sectionEndAnchor params through the generated Zod schema", async () => {
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

    // Numbers arrive as strings from some callers; the schema uses z.coerce so they must still validate.
    const params = confluenceUpdatePageFragmentsParamsSchema.parse({
      pageId: "193957299",
      tableCellUpdates: [
        {
          rowAnchor: USER_KEY,
          rowOccurrence: "1",
          columnIndex: 1,
          newContent: "<p>Closed 4 tickets</p>",
        },
      ],
      replacements: [
        // Cell updates run first, so by now the only "TBD" left in the ServiceNow section is "Plans TBD".
        {
          find: "TBD",
          replace: "Done",
          occurrence: "0",
          sectionAnchor: "<h3>ServiceNow</h3>",
          sectionEndAnchor: "<h3>SharePoint</h3>",
        },
      ],
    });
    expect(params.tableCellUpdates?.[0].rowOccurrence).toBe(1);
    expect(params.replacements?.[0].occurrence).toBe(0);

    // Negative indexes are rejected at the schema level (minimum: 0), matching the handler's own validation.
    const negative = confluenceUpdatePageFragmentsParamsSchema.safeParse({
      pageId: "1",
      tableCellUpdates: [
        {
          rowAnchor: "x",
          rowOccurrence: -1,
          columnIndex: 0,
          newContent: "<p>x</p>",
        },
      ],
      replacements: [{ find: "a", replace: "b", occurrence: "-2" }],
    });
    expect(negative.success).toBe(false);
    expect(
      negative.success
        ? []
        : negative.error.issues.map((i) => i.path.join(".")),
    ).toEqual([
      "tableCellUpdates.0.rowOccurrence",
      "replacements.0.occurrence",
    ]);

    const result = await confluenceUpdatePageFragments({
      params,
      authParams: { authToken: "token" },
    });

    expect(result.success).toBe(true);
    const payload = mockPut.mock.calls[0][1];
    expect(payload.body.value).toContain("Cloud work TBD");
    expect(payload.body.value).toContain(
      "<td><p>Closed 4 tickets</p></td><td><p>Plans Done</p></td>",
    );
  });

  it("handles numeric-string indexes the way invokeAction delivers them (validated, but passed through un-coerced)", async () => {
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

    // Same two steps as src/actions/invoke.ts: safeParse for validation, then call the handler with the ORIGINAL
    // parameters (not safeParse's coerced .data). Strings therefore reach the handler as strings.
    const rawParameters = {
      pageId: "193957299",
      tableCellUpdates: [
        {
          rowAnchor: USER_KEY,
          rowOccurrence: "1",
          columnIndex: "1",
          newContent: "<p>Closed 4 tickets</p>",
        },
      ],
      replacements: [{ find: "TBD", replace: "Done", occurrence: "1" }],
    };
    expect(
      confluenceUpdatePageFragmentsParamsSchema.safeParse(rawParameters)
        .success,
    ).toBe(true);

    const result = await confluenceUpdatePageFragments({
      params:
        rawParameters as unknown as confluenceUpdatePageFragmentsParamsType,
      authParams: { authToken: "token" },
    });

    expect(result).toMatchObject({
      success: true,
      cellsUpdated: 1,
      replacementsApplied: 1,
    });
    const payload = mockPut.mock.calls[0][1];
    expect(payload.body.value).toContain(
      "<td><p>Closed 4 tickets</p></td><td><p>Plans Done</p></td>",
    );
    expect(payload.body.value).toContain("Cloud work TBD");
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
