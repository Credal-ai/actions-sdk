import type { docs_v1 } from "@googleapis/docs";
import { describe, expect, it } from "@jest/globals";
import {
  markdownToDocRequests,
  parseHtmlContent,
  parseHtmlToDocRequests,
  plainTextToDocRequests,
} from "../../src/actions/providers/google-oauth/utils/googleDocsMarkdown";

type Request = docs_v1.Schema$Request;

function getInsertTexts(requests: Request[]): string[] {
  return requests
    .filter(
      (r): r is Request & Required<Pick<Request, "insertText">> =>
        "insertText" in r,
    )
    .map((r) => r.insertText.text ?? "");
}

function getFullText(requests: Request[]): string {
  return getInsertTexts(requests).join("");
}

describe("plainTextToDocRequests", () => {
  it("wraps text in a single insertText request at index 1", () => {
    const requests = plainTextToDocRequests("Hello world");
    expect(requests).toEqual([
      { insertText: { location: { index: 1 }, text: "Hello world" } },
    ]);
  });
});

describe("parseHtmlContent", () => {
  it("parses bold tags", () => {
    const items = parseHtmlContent("<b>bold</b>");
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("bold");
    expect(items[0].formatting?.bold).toBe(true);
  });

  it("parses strong tags same as bold", () => {
    const items = parseHtmlContent("<strong>text</strong>");
    expect(items[0].formatting?.bold).toBe(true);
  });

  it("parses italic with em and i tags", () => {
    const emItems = parseHtmlContent("<em>italic</em>");
    expect(emItems[0].formatting?.italic).toBe(true);

    const iItems = parseHtmlContent("<i>italic</i>");
    expect(iItems[0].formatting?.italic).toBe(true);
  });

  it("parses links and preserves URL", () => {
    const items = parseHtmlContent(
      '<a href="https://example.com/path?q=1&amp;r=2">click</a>',
    );
    expect(items[0].text).toBe("click");
    expect(items[0].formatting?.link?.url).toBe(
      "https://example.com/path?q=1&r=2",
    );
  });

  it("parses code tags with monospace font", () => {
    const items = parseHtmlContent("<code>foo()</code>");
    expect(items[0].formatting?.weightedFontFamily?.fontFamily).toBe(
      "Courier New",
    );
  });

  it("parses code tags with class attributes (fenced code blocks)", () => {
    const items = parseHtmlContent(
      '<pre><code class="language-python">x = 1</code></pre>',
    );
    const codeItem = items.find((i) => i.text.trim().length > 0);
    expect(codeItem?.formatting?.weightedFontFamily?.fontFamily).toBe(
      "Courier New",
    );
    expect(codeItem?.text).toBe("x = 1");
  });

  it("parses nested formatting (bold inside italic)", () => {
    const items = parseHtmlContent("<em>italic <b>bold-italic</b> italic</em>");
    expect(items).toHaveLength(3);

    expect(items[0].text).toBe("italic ");
    expect(items[0].formatting?.italic).toBe(true);
    expect(items[0].formatting?.bold).toBeUndefined();

    expect(items[1].text).toBe("bold-italic");
    expect(items[1].formatting?.italic).toBe(true);
    expect(items[1].formatting?.bold).toBe(true);

    expect(items[2].text).toBe(" italic");
    expect(items[2].formatting?.italic).toBe(true);
    expect(items[2].formatting?.bold).toBeUndefined();
  });

  it("parses unordered lists with correct bullet preset", () => {
    const items = parseHtmlContent("<ul><li>one</li><li>two</li></ul>");
    const textItems = items.filter((i) => i.text.trim().length > 0);
    expect(
      textItems.every((i) => i.bulletPreset === "BULLET_DISC_CIRCLE_SQUARE"),
    ).toBe(true);
    expect(textItems.map((i) => i.text)).toContain("one");
    expect(textItems.map((i) => i.text)).toContain("two");
  });

  it("parses ordered lists with numbered preset", () => {
    const items = parseHtmlContent("<ol><li>first</li><li>second</li></ol>");
    const textItems = items.filter((i) => i.text.trim().length > 0);
    expect(
      textItems.every((i) => i.bulletPreset === "NUMBERED_DECIMAL_ALPHA_ROMAN"),
    ).toBe(true);
  });

  it("parses headings with headingLevel", () => {
    for (let level = 1; level <= 6; level++) {
      const items = parseHtmlContent(`<h${level}>Title</h${level}>`);
      const textItem = items.find((i) => i.text.trim().length > 0);
      expect(textItem?.headingLevel).toBe(level);
    }
  });

  it("decodes all common HTML entities", () => {
    const items = parseHtmlContent(
      "<p>&amp; &lt; &gt; &quot; &#39; &nbsp;</p>",
    );
    const text = items.map((i) => i.text).join("");
    expect(text).toContain("& < > \" '");
  });

  it("returns plain text fallback when no tags present", () => {
    const items = parseHtmlContent("just plain text");
    expect(items).toEqual([{ text: "just plain text" }]);
  });

  it("handles adjacent formatting without losing text", () => {
    const items = parseHtmlContent("<b>bold</b> normal <i>italic</i>");
    const text = items.map((i) => i.text).join("");
    expect(text).toBe("bold normal italic");
  });
});

describe("parseHtmlToDocRequests — exact structure", () => {
  it("bold then italic: <b>AB</b><i>CD</i>", () => {
    expect(parseHtmlToDocRequests("<b>AB</b><i>CD</i>")).toEqual([
      // inserts first
      { insertText: { location: { index: 1 }, text: "AB" } },
      { insertText: { location: { index: 3 }, text: "CD" } },
      // then styles
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 3 },
          textStyle: { bold: true },
          fields: "bold",
        },
      },
      {
        updateTextStyle: {
          range: { startIndex: 3, endIndex: 5 },
          textStyle: { italic: true },
          fields: "italic",
        },
      },
    ]);
  });

  it("heading: <h1>Title</h1>", () => {
    expect(parseHtmlToDocRequests("<h1>Title</h1>")).toEqual([
      { insertText: { location: { index: 1 }, text: "Title" } },
      { insertText: { location: { index: 6 }, text: "\n" } },
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 6 },
          paragraphStyle: { namedStyleType: "HEADING_1" },
          fields: "namedStyleType",
        },
      },
    ]);
  });

  it("heading with nested bold: <h2>A <b>B</b> C</h2>", () => {
    expect(parseHtmlToDocRequests("<h2>A <b>B</b> C</h2>")).toEqual([
      { insertText: { location: { index: 1 }, text: "A " } },
      { insertText: { location: { index: 3 }, text: "B" } },
      { insertText: { location: { index: 4 }, text: " C" } },
      { insertText: { location: { index: 6 }, text: "\n" } },
      {
        updateTextStyle: {
          range: { startIndex: 3, endIndex: 4 },
          textStyle: { bold: true },
          fields: "bold",
        },
      },
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 3 },
          paragraphStyle: { namedStyleType: "HEADING_2" },
          fields: "namedStyleType",
        },
      },
      {
        updateParagraphStyle: {
          range: { startIndex: 3, endIndex: 4 },
          paragraphStyle: { namedStyleType: "HEADING_2" },
          fields: "namedStyleType",
        },
      },
      {
        updateParagraphStyle: {
          range: { startIndex: 4, endIndex: 6 },
          paragraphStyle: { namedStyleType: "HEADING_2" },
          fields: "namedStyleType",
        },
      },
    ]);
  });

  it('link: <a href="https://x.com">click</a>', () => {
    expect(parseHtmlToDocRequests('<a href="https://x.com">click</a>')).toEqual(
      [
        { insertText: { location: { index: 1 }, text: "click" } },
        {
          updateTextStyle: {
            range: { startIndex: 1, endIndex: 6 },
            textStyle: { link: { url: "https://x.com" } },
            fields: "link",
          },
        },
      ],
    );
  });

  it("unordered list: <ul><li>a</li><li>b</li></ul>", () => {
    expect(parseHtmlToDocRequests("<ul><li>a</li><li>b</li></ul>")).toEqual([
      { insertText: { location: { index: 1 }, text: "a" } },
      { insertText: { location: { index: 2 }, text: "\n" } },
      { insertText: { location: { index: 3 }, text: "b" } },
      { insertText: { location: { index: 4 }, text: "\n" } },
      { insertText: { location: { index: 5 }, text: "\n" } },
      {
        createParagraphBullets: {
          range: { startIndex: 1, endIndex: 2 },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      },
      {
        createParagraphBullets: {
          range: { startIndex: 3, endIndex: 4 },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      },
    ]);
  });

  it("ordered list: <ol><li>first</li><li>second</li></ol>", () => {
    expect(
      parseHtmlToDocRequests("<ol><li>first</li><li>second</li></ol>"),
    ).toEqual([
      { insertText: { location: { index: 1 }, text: "first" } },
      { insertText: { location: { index: 6 }, text: "\n" } },
      { insertText: { location: { index: 7 }, text: "second" } },
      { insertText: { location: { index: 13 }, text: "\n" } },
      { insertText: { location: { index: 14 }, text: "\n" } },
      {
        createParagraphBullets: {
          range: { startIndex: 1, endIndex: 6 },
          bulletPreset: "NUMBERED_DECIMAL_ALPHA_ROMAN",
        },
      },
      {
        createParagraphBullets: {
          range: { startIndex: 7, endIndex: 13 },
          bulletPreset: "NUMBERED_DECIMAL_ALPHA_ROMAN",
        },
      },
    ]);
  });

  it('paragraph with bold and link: <p>See <b>this</b> <a href="https://u.com">link</a>.</p>', () => {
    expect(
      parseHtmlToDocRequests(
        '<p>See <b>this</b> <a href="https://u.com">link</a>.</p>',
      ),
    ).toEqual([
      { insertText: { location: { index: 1 }, text: "See " } },
      { insertText: { location: { index: 5 }, text: "this" } },
      { insertText: { location: { index: 9 }, text: " " } },
      { insertText: { location: { index: 10 }, text: "link" } },
      { insertText: { location: { index: 14 }, text: "." } },
      { insertText: { location: { index: 15 }, text: "\n" } },
      {
        updateTextStyle: {
          range: { startIndex: 5, endIndex: 9 },
          textStyle: { bold: true },
          fields: "bold",
        },
      },
      {
        updateTextStyle: {
          range: { startIndex: 10, endIndex: 14 },
          textStyle: { link: { url: "https://u.com" } },
          fields: "link",
        },
      },
    ]);
  });

  it("code in paragraph: <p>Use <code>foo()</code> here</p>", () => {
    expect(
      parseHtmlToDocRequests("<p>Use <code>foo()</code> here</p>"),
    ).toEqual([
      { insertText: { location: { index: 1 }, text: "Use " } },
      { insertText: { location: { index: 5 }, text: "foo()" } },
      { insertText: { location: { index: 10 }, text: " here" } },
      { insertText: { location: { index: 15 }, text: "\n" } },
      {
        updateTextStyle: {
          range: { startIndex: 5, endIndex: 10 },
          textStyle: { weightedFontFamily: { fontFamily: "Courier New" } },
          fields: "weightedFontFamily",
        },
      },
    ]);
  });

  it("nested bold+italic: <em>a <b>b</b> c</em>", () => {
    expect(parseHtmlToDocRequests("<em>a <b>b</b> c</em>")).toEqual([
      { insertText: { location: { index: 1 }, text: "a " } },
      { insertText: { location: { index: 3 }, text: "b" } },
      { insertText: { location: { index: 4 }, text: " c" } },
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 3 },
          textStyle: { italic: true },
          fields: "italic",
        },
      },
      {
        updateTextStyle: {
          range: { startIndex: 3, endIndex: 4 },
          textStyle: { italic: true, bold: true },
          fields: "italic,bold",
        },
      },
      {
        updateTextStyle: {
          range: { startIndex: 4, endIndex: 6 },
          textStyle: { italic: true },
          fields: "italic",
        },
      },
    ]);
  });

  it('bold link: <a href="https://c.ai"><strong>go</strong></a>', () => {
    expect(
      parseHtmlToDocRequests('<a href="https://c.ai"><strong>go</strong></a>'),
    ).toEqual([
      { insertText: { location: { index: 1 }, text: "go" } },
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 3 },
          textStyle: { link: { url: "https://c.ai" }, bold: true },
          fields: "link,bold",
        },
      },
    ]);
  });

  it("plain text (no tags)", () => {
    expect(parseHtmlToDocRequests("just text")).toEqual([
      { insertText: { location: { index: 1 }, text: "just text" } },
    ]);
  });

  it("multi-section: heading + paragraph + list", () => {
    const html =
      "<h1>Title</h1><p>Intro with <b>bold</b>.</p><ul><li>item</li></ul>";
    expect(parseHtmlToDocRequests(html)).toEqual([
      // inserts
      { insertText: { location: { index: 1 }, text: "Title" } },
      { insertText: { location: { index: 6 }, text: "\n" } },
      { insertText: { location: { index: 7 }, text: "Intro with " } },
      { insertText: { location: { index: 18 }, text: "bold" } },
      { insertText: { location: { index: 22 }, text: "." } },
      { insertText: { location: { index: 23 }, text: "\n" } },
      { insertText: { location: { index: 24 }, text: "item" } },
      { insertText: { location: { index: 28 }, text: "\n" } },
      { insertText: { location: { index: 29 }, text: "\n" } },
      // styles
      {
        updateTextStyle: {
          range: { startIndex: 18, endIndex: 22 },
          textStyle: { bold: true },
          fields: "bold",
        },
      },
      // paragraph styles
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 6 },
          paragraphStyle: { namedStyleType: "HEADING_1" },
          fields: "namedStyleType",
        },
      },
      // bullets
      {
        createParagraphBullets: {
          range: { startIndex: 24, endIndex: 28 },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      },
    ]);
  });
});

describe("markdownToDocRequests — realistic multi-element documents", () => {
  it("heading followed by paragraph with bold and link", () => {
    const md =
      "# Summary\n\nThis has **bold** and a [link](https://example.com).";
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);
    const ps = requests.filter((r) => r.updateParagraphStyle);

    expect(text).toContain("Summary");
    expect(text).toContain("This has ");
    expect(text).toContain("bold");
    expect(text).toContain("link");
    expect(text).not.toContain("**");
    expect(text).not.toContain("[link]");
    expect(text).not.toContain("#");

    expect(ps).toHaveLength(1);
    expect(ps[0].updateParagraphStyle!.paragraphStyle!.namedStyleType).toBe(
      "HEADING_1",
    );

    const boldReq = styles.find((r) => r.updateTextStyle!.textStyle!.bold);
    expect(boldReq).toBeDefined();

    const linkReq = styles.find((r) => r.updateTextStyle!.textStyle!.link);
    expect(linkReq).toBeDefined();
    expect(linkReq!.updateTextStyle!.textStyle!.link!.url).toBe(
      "https://example.com",
    );
  });

  it("multiple headings with mixed bullet and numbered lists", () => {
    const md = `## Overview

- bullet one
- bullet two

## Steps

1. step one
2. step two

Done.`;
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const ps = requests.filter((r) => r.updateParagraphStyle);
    const bullets = requests.filter((r) => r.createParagraphBullets);

    expect(text).toContain("Overview");
    expect(text).toContain("bullet one");
    expect(text).toContain("Steps");
    expect(text).toContain("step one");
    expect(text).toContain("Done.");

    expect(ps).toHaveLength(2);
    expect(ps[0].updateParagraphStyle!.paragraphStyle!.namedStyleType).toBe(
      "HEADING_2",
    );
    expect(ps[1].updateParagraphStyle!.paragraphStyle!.namedStyleType).toBe(
      "HEADING_2",
    );

    const unorderedBullets = bullets.filter(
      (r) =>
        r.createParagraphBullets!.bulletPreset === "BULLET_DISC_CIRCLE_SQUARE",
    );
    const orderedBullets = bullets.filter(
      (r) =>
        r.createParagraphBullets!.bulletPreset ===
        "NUMBERED_DECIMAL_ALPHA_ROMAN",
    );
    expect(unorderedBullets.length).toBeGreaterThanOrEqual(2);
    expect(orderedBullets.length).toBeGreaterThanOrEqual(2);
  });

  it("bold link — nested inline formatting inside anchor", () => {
    const md = "[**bold link**](https://credal.ai)";
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);

    expect(text).toContain("bold link");
    expect(text).not.toContain("**");
    expect(text).not.toContain("[");

    const hasLinkAndBold = styles.some((r) => {
      const ts = r.updateTextStyle!.textStyle!;
      return ts.bold === true && ts.link?.url === "https://credal.ai";
    });
    expect(hasLinkAndBold).toBe(true);
  });

  it("italic code — code inside emphasis", () => {
    const md = "*use `getValue()` carefully*";
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);

    expect(text).toContain("getValue()");
    expect(text).not.toContain("`");

    const codeReq = styles.find(
      (r) =>
        r.updateTextStyle!.textStyle!.weightedFontFamily?.fontFamily ===
        "Courier New",
    );
    expect(codeReq).toBeDefined();

    const italicReqs = styles.filter(
      (r) => r.updateTextStyle!.textStyle!.italic,
    );
    expect(italicReqs.length).toBeGreaterThan(0);
  });

  it("list items with inline formatting", () => {
    const md = `- **bold item**
- *italic item*
- item with \`code\`
- item with [link](https://x.com)`;
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);
    const bullets = requests.filter((r) => r.createParagraphBullets);

    expect(text).toContain("bold item");
    expect(text).toContain("italic item");
    expect(text).toContain("code");
    expect(text).toContain("link");
    expect(text).not.toContain("**");
    expect(text).not.toContain("*italic");
    expect(text).not.toContain("`");
    expect(text).not.toContain("[link]");

    expect(bullets.length).toBeGreaterThanOrEqual(4);
    expect(
      styles.find((r) => r.updateTextStyle!.textStyle!.bold),
    ).toBeDefined();
    expect(
      styles.find((r) => r.updateTextStyle!.textStyle!.italic),
    ).toBeDefined();
    expect(
      styles.find(
        (r) =>
          r.updateTextStyle!.textStyle!.weightedFontFamily?.fontFamily ===
          "Courier New",
      ),
    ).toBeDefined();
    expect(
      styles.find(
        (r) => r.updateTextStyle!.textStyle!.link?.url === "https://x.com",
      ),
    ).toBeDefined();
  });

  it("heading with bold text inside", () => {
    const md = "# The **important** heading";
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);
    const ps = requests.filter((r) => r.updateParagraphStyle);

    expect(text).toContain("The ");
    expect(text).toContain("important");
    expect(text).toContain(" heading");
    expect(text).not.toContain("**");

    expect(ps.length).toBeGreaterThanOrEqual(1);
    expect(
      ps.every(
        (r) =>
          r.updateParagraphStyle!.paragraphStyle!.namedStyleType ===
          "HEADING_1",
      ),
    ).toBe(true);

    const boldReq = styles.find((r) => r.updateTextStyle!.textStyle!.bold);
    expect(boldReq).toBeDefined();
  });

  it("fenced code block with language annotation preserves content", () => {
    const md = "```python\ndef hello():\n    return 'world'\n```";
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);

    expect(text).toContain("def hello():");
    expect(text).toContain("return 'world'");
    expect(text).not.toContain("```");

    const codeReq = styles.find(
      (r) =>
        r.updateTextStyle!.textStyle!.weightedFontFamily?.fontFamily ===
        "Courier New",
    );
    expect(codeReq).toBeDefined();
  });

  it("paragraph between two lists keeps correct structure", () => {
    const md = `- a
- b

Middle paragraph.

1. one
2. two`;
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const bullets = requests.filter((r) => r.createParagraphBullets);

    expect(text).toContain("a");
    expect(text).toContain("b");
    expect(text).toContain("Middle paragraph.");
    expect(text).toContain("one");
    expect(text).toContain("two");

    const ul = bullets.filter(
      (r) =>
        r.createParagraphBullets!.bulletPreset === "BULLET_DISC_CIRCLE_SQUARE",
    );
    const ol = bullets.filter(
      (r) =>
        r.createParagraphBullets!.bulletPreset ===
        "NUMBERED_DECIMAL_ALPHA_ROMAN",
    );
    expect(ul.length).toBeGreaterThanOrEqual(2);
    expect(ol.length).toBeGreaterThanOrEqual(2);

    const inserts = requests.filter((r) => r.insertText);
    const midInsert = inserts.find(
      (r) => r.insertText!.text === "Middle paragraph.",
    );
    expect(midInsert).toBeDefined();
    const midIndex = midInsert!.insertText!.location!.index!;
    const noBulletOnMiddle = bullets.every((r) => {
      const range = r.createParagraphBullets!.range!;
      return (
        range.endIndex! <= midIndex ||
        range.startIndex! > midIndex + "Middle paragraph.".length
      );
    });
    expect(noBulletOnMiddle).toBe(true);
  });

  it("complex real-world agent report", () => {
    const md = `# Q4 Revenue Report

## Summary

Revenue grew **23%** YoY to **$4.2M**. See [full dashboard](https://analytics.credal.ai/q4).

## Key Highlights

- **Enterprise** segment up *31%*
- **SMB** segment up *18%*
- New logo acquisition: \`47 accounts\`

## Next Steps

1. Finalize **board deck** by Friday
2. Schedule review with *leadership team*
3. Update [forecast model](https://sheets.google.com/forecast)

\`\`\`
Note: All figures are preliminary and subject to audit.
\`\`\`
`;
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);
    const styles = requests.filter((r) => r.updateTextStyle);
    const ps = requests.filter((r) => r.updateParagraphStyle);
    const bullets = requests.filter((r) => r.createParagraphBullets);

    // All text present, no markdown syntax leaked
    expect(text).toContain("Q4 Revenue Report");
    expect(text).toContain("Revenue grew ");
    expect(text).toContain("23%");
    expect(text).toContain("$4.2M");
    expect(text).toContain("full dashboard");
    expect(text).toContain("Enterprise");
    expect(text).toContain("47 accounts");
    expect(text).toContain("Finalize ");
    expect(text).toContain("board deck");
    expect(text).toContain("forecast model");
    expect(text).toContain("All figures are preliminary");
    expect(text).not.toContain("**");
    expect(text).not.toContain("##");
    expect(text).not.toContain("```");
    expect(text).not.toContain("[full dashboard]");
    expect(text).not.toContain("[forecast model]");

    // 4 headings: h1 + 3x h2
    const psByType = ps.map(
      (r) => r.updateParagraphStyle!.paragraphStyle!.namedStyleType,
    );
    const h1Count = psByType.filter((t) => t === "HEADING_1").length;
    const h2Count = psByType.filter((t) => t === "HEADING_2").length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h2Count).toBeGreaterThanOrEqual(3);

    // Bold, italic, link, code all present
    expect(
      styles.find((r) => r.updateTextStyle!.textStyle!.bold),
    ).toBeDefined();
    expect(
      styles.find((r) => r.updateTextStyle!.textStyle!.italic),
    ).toBeDefined();
    expect(
      styles.find((r) => r.updateTextStyle!.textStyle!.link),
    ).toBeDefined();
    expect(
      styles.find(
        (r) =>
          r.updateTextStyle!.textStyle!.weightedFontFamily?.fontFamily ===
          "Courier New",
      ),
    ).toBeDefined();

    // Unordered (3 items) + ordered (3 items)
    const ul = bullets.filter(
      (r) =>
        r.createParagraphBullets!.bulletPreset === "BULLET_DISC_CIRCLE_SQUARE",
    );
    const ol = bullets.filter(
      (r) =>
        r.createParagraphBullets!.bulletPreset ===
        "NUMBERED_DECIMAL_ALPHA_ROMAN",
    );
    expect(ul.length).toBeGreaterThanOrEqual(3);
    expect(ol.length).toBeGreaterThanOrEqual(3);

    // Links have correct URLs
    const linkStyles = styles.filter((r) => r.updateTextStyle!.textStyle!.link);
    const urls = linkStyles.map((r) => r.updateTextStyle!.textStyle!.link!.url);
    expect(urls).toContain("https://analytics.credal.ai/q4");
    expect(urls).toContain("https://sheets.google.com/forecast");

    // Request ordering invariant
    const kinds = requests.map((r) => {
      if (r.insertText) return "insert";
      if (r.updateTextStyle) return "style";
      if (r.updateParagraphStyle) return "paragraph";
      if (r.createParagraphBullets) return "bullet";
      return "unknown";
    });
    const order = ["insert", "style", "paragraph", "bullet"];
    let lastSeen = -1;
    for (const kind of kinds) {
      const idx = order.indexOf(kind);
      expect(idx).toBeGreaterThanOrEqual(lastSeen);
      lastSeen = idx;
    }
  });

  it("consecutive index ranges are contiguous with no gaps", () => {
    const md = "**A***B*C";
    const requests = markdownToDocRequests(md);
    const inserts = requests.filter((r) => r.insertText);

    let expectedIndex = 1;
    for (const req of inserts) {
      expect(req.insertText!.location!.index).toBe(expectedIndex);
      expectedIndex += (req.insertText!.text ?? "").length;
    }
  });

  it("style ranges exactly match corresponding insert ranges", () => {
    const md = "**bold** plain *italic*";
    const requests = markdownToDocRequests(md);
    const inserts = requests.filter((r) => r.insertText);
    const styles = requests.filter((r) => r.updateTextStyle);

    const insertMap = new Map<number, number>();
    for (const req of inserts) {
      const start = req.insertText!.location!.index!;
      const end = start + (req.insertText!.text ?? "").length;
      insertMap.set(start, end);
    }

    for (const req of styles) {
      const range = req.updateTextStyle!.range!;
      expect(insertMap.get(range.startIndex!)).toBe(range.endIndex!);
    }
  });
});

describe("markdownToDocRequests", () => {
  it("converts heading with updateParagraphStyle", () => {
    const requests = markdownToDocRequests("# Hello");
    const ps = requests.filter((r) => r.updateParagraphStyle);
    expect(ps.length).toBe(1);
    expect(ps[0].updateParagraphStyle!.paragraphStyle!.namedStyleType).toBe(
      "HEADING_1",
    );
    expect(getFullText(requests)).toContain("Hello");
  });

  it("converts h2 heading", () => {
    const requests = markdownToDocRequests("## Section");
    const ps = requests.filter((r) => r.updateParagraphStyle);
    expect(ps[0].updateParagraphStyle!.paragraphStyle!.namedStyleType).toBe(
      "HEADING_2",
    );
  });

  it("converts **bold** and *italic*", () => {
    const requests = markdownToDocRequests("**bold** and *italic*");
    const styles = requests.filter((r) => r.updateTextStyle);
    const boldReq = styles.find(
      (r) => r.updateTextStyle!.textStyle!.bold === true,
    );
    const italicReq = styles.find(
      (r) => r.updateTextStyle!.textStyle!.italic === true,
    );
    expect(boldReq).toBeDefined();
    expect(italicReq).toBeDefined();
  });

  it("converts ***bold-italic***", () => {
    const requests = markdownToDocRequests("***both***");
    const styles = requests.filter((r) => r.updateTextStyle);
    const bothReq = styles.find(
      (r) =>
        r.updateTextStyle!.textStyle!.bold === true &&
        r.updateTextStyle!.textStyle!.italic === true,
    );
    expect(bothReq).toBeDefined();
  });

  it("converts [link](url) with correct URL", () => {
    const requests = markdownToDocRequests("[click](https://credal.ai)");
    const styles = requests.filter((r) => r.updateTextStyle);
    const linkReq = styles.find(
      (r) => r.updateTextStyle!.textStyle!.link !== undefined,
    );
    expect(linkReq).toBeDefined();
    expect(linkReq!.updateTextStyle!.textStyle!.link!.url).toBe(
      "https://credal.ai",
    );
    expect(getFullText(requests)).toContain("click");
    expect(getFullText(requests)).not.toContain("https://credal.ai");
  });

  it("converts unordered list with bullet requests", () => {
    const requests = markdownToDocRequests("- one\n- two\n- three");
    const bulletReqs = requests.filter((r) => r.createParagraphBullets);
    expect(bulletReqs.length).toBeGreaterThanOrEqual(3);
    expect(bulletReqs[0].createParagraphBullets!.bulletPreset).toBe(
      "BULLET_DISC_CIRCLE_SQUARE",
    );
    const text = getFullText(requests);
    expect(text).toContain("one");
    expect(text).toContain("two");
    expect(text).toContain("three");
  });

  it("converts ordered list with numbered requests", () => {
    const requests = markdownToDocRequests("1. first\n2. second");
    const bulletReqs = requests.filter((r) => r.createParagraphBullets);
    expect(bulletReqs.length).toBeGreaterThanOrEqual(2);
    expect(bulletReqs[0].createParagraphBullets!.bulletPreset).toBe(
      "NUMBERED_DECIMAL_ALPHA_ROMAN",
    );
  });

  it("converts inline `code` with monospace font", () => {
    const requests = markdownToDocRequests("use `foo()` here");
    const styles = requests.filter((r) => r.updateTextStyle);
    const codeReq = styles.find(
      (r) =>
        r.updateTextStyle!.textStyle!.weightedFontFamily?.fontFamily ===
        "Courier New",
    );
    expect(codeReq).toBeDefined();
    expect(getFullText(requests)).toContain("foo()");
  });

  it("converts fenced code blocks with monospace font", () => {
    const requests = markdownToDocRequests("```\nconst x = 1;\n```");
    const styles = requests.filter((r) => r.updateTextStyle);
    const codeReq = styles.find(
      (r) =>
        r.updateTextStyle!.textStyle!.weightedFontFamily?.fontFamily ===
        "Courier New",
    );
    expect(codeReq).toBeDefined();
    expect(getFullText(requests)).toContain("const x = 1;");
  });

  it("returns empty requests for empty input", () => {
    expect(markdownToDocRequests("")).toEqual([]);
  });

  it("preserves text content through the full pipeline", () => {
    const md = `# Report Title

This is a **summary** with a [link](https://credal.ai).

## Details

- First item
- Second item with *emphasis*

Use \`code\` for technical terms.

1. Step one
2. Step two
`;
    const requests = markdownToDocRequests(md);
    const text = getFullText(requests);

    expect(text).toContain("Report Title");
    expect(text).toContain("summary");
    expect(text).toContain("link");
    expect(text).toContain("Details");
    expect(text).toContain("First item");
    expect(text).toContain("emphasis");
    expect(text).toContain("code");
    expect(text).toContain("Step one");

    expect(text).not.toContain("**");
    expect(text).not.toContain("##");
    expect(text).not.toContain("[link]");

    const ps = requests.filter((r) => r.updateParagraphStyle);
    expect(ps.length).toBe(2);

    const bullets = requests.filter((r) => r.createParagraphBullets);
    expect(bullets.length).toBeGreaterThanOrEqual(4);
  });

  it("does not produce markdown syntax in output text", () => {
    const md = "**bold** *italic* [link](http://x.com) `code` # heading";
    const text = getFullText(markdownToDocRequests(md));
    expect(text).not.toContain("**");
    expect(text).not.toMatch(/(?<!=)\*(?!=)/);
    expect(text).not.toContain("`");
    expect(text).not.toContain("[link]");
  });
});
