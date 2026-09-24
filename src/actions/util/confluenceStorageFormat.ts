/**
 * Deterministic, string-based editing of Confluence storage-format (XHTML) page bodies.
 *
 * The goal of this module is to let a caller (typically an LLM agent) update a small part of a
 * large Confluence page — a single table cell, a row, or an exact snippet — without ever having
 * to carry and re-emit the full page body. Everything outside the targeted fragment is preserved
 * byte-for-byte: the body is never parsed and re-serialised, so macros, user mentions, colgroups,
 * emoticons, etc. survive untouched.
 *
 * Every edit is checked both locally (the fragment being inserted must be well-formed and must not
 * open/close table structure it does not own) and globally (the table skeleton of the original page
 * must survive intact) before the result is handed back for saving.
 */

/** Options that narrow down which table row an edit targets. Shared by cell updates and row-scoped replacements. */
export type ConfluenceRowTargetOptions = {
  /** Text/markup identifying the section whose table(s) to search; see {@link resolveSectionTables}. */
  sectionAnchor?: string;
  /**
   * Text/markup of a heading enclosing the section, e.g. `<h2>Application Development</h2>`. The page is first
   * narrowed to that heading's region (up to the next heading of the same or a higher level) and `sectionAnchor`
   * is then resolved inside it. Use it when the same subsection heading appears under several parents.
   */
  parentSectionAnchor?: string;
  /** Zero-based index into the rows matching `rowAnchor` (in document order) when the anchor is not unique. */
  rowOccurrence?: number;
};

export type ConfluenceTableCellUpdate = ConfluenceRowTargetOptions & {
  rowAnchor: string;
  columnHeader?: string;
  columnIndex?: number;
  newContent: string;
  mode?: "replace" | "append" | "prepend";
};

export type ConfluenceReplacement = ConfluenceRowTargetOptions & {
  find: string;
  replace: string;
  replaceAll?: boolean;
  /** Zero-based index of the occurrence of `find` within the scope to replace. Mutually exclusive with `replaceAll`. */
  occurrence?: number;
  rowAnchor?: string;
  /** Text that ends the search scope (exclusive). Searched for after `sectionAnchor`. Not allowed with `rowAnchor`. */
  sectionEndAnchor?: string;
};

export type ConfluenceFragmentUpdateInput = {
  tableCellUpdates?: ConfluenceTableCellUpdate[];
  replacements?: ConfluenceReplacement[];
  requiredMarkers?: string[];
};

export type ConfluenceFragmentUpdateResult = {
  body: string;
  cellsUpdated: number;
  replacementsApplied: number;
};

export class ConfluenceFragmentUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfluenceFragmentUpdateError";
  }
}

type ElementSpan = {
  /** Index of the opening `<` of the start tag. */
  start: number;
  /** Index just past the `>` of the end tag. */
  end: number;
  /** Index just past the `>` of the start tag (start of inner content). */
  innerStart: number;
  /** Index of the `<` of the end tag (end of inner content). */
  innerEnd: number;
  /** Nesting depth among elements of the same tag name (0 = outermost). */
  depth: number;
};

type TagToken = {
  name: string;
  closing: boolean;
  selfClosing: boolean;
  /** Raw attribute text of the start tag. */
  attrs: string;
};

/** Tags that make up the skeleton of a table. Edits must never add or remove these except as complete nested tables. */
const STRUCTURAL_TAGS = new Set(["table", "thead", "tbody", "tfoot", "tr", "td", "th", "colgroup", "col"]);

/** HTML void elements that never have a closing tag even if written without a trailing slash. */
const VOID_TAGS = new Set(["br", "hr", "img", "col", "input", "meta", "link", "area", "base", "wbr"]);

/**
 * Attribute section of a tag. Quoted values are consumed as a unit so a `>` inside a value
 * (e.g. `ri:filename="a>b"`) does not terminate the tag early.
 */
const TAG_ATTRS_PATTERN = `(?:"[^"]*"|'[^']*'|[^"'>])*`;

/**
 * Comments and CDATA sections (e.g. code-block macro bodies). Their contents are opaque text, not markup,
 * so every scanner in this module must skip over them with this same rule.
 */
const OPAQUE_SECTION_PATTERN = `<!--[\\s\\S]*?-->|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`;

// Matches an opaque section (skipped) or a single tag with its name, attributes and closing markers.
const TAG_TOKEN_REGEX = new RegExp(
  `${OPAQUE_SECTION_PATTERN}|<(\\/?)([a-zA-Z][\\w:.-]*)(${TAG_ATTRS_PATTERN}?)(\\/?)>`,
  "g",
);

/** Matches any single complete tag (used for stripping markup from header text). */
const ANY_TAG_REGEX = new RegExp(`<${TAG_ATTRS_PATTERN}>`, "g");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenizeTags(html: string): TagToken[] {
  const tokens: TagToken[] = [];
  let match: RegExpExecArray | null;
  TAG_TOKEN_REGEX.lastIndex = 0;
  while ((match = TAG_TOKEN_REGEX.exec(html)) !== null) {
    if (match[2] === undefined) continue; // comment / CDATA
    const name = match[2].toLowerCase();
    const closing = match[1] === "/";
    tokens.push({
      name,
      closing,
      selfClosing: !closing && (match[4] === "/" || VOID_TAGS.has(name)),
      attrs: match[3] ?? "",
    });
  }
  return tokens;
}

/**
 * Reduces a fragment's tags to the ones left unmatched after cancelling balanced open/close pairs.
 * An empty result means the fragment is well-formed on its own. Two fragments with equal signatures
 * have the same net effect on the surrounding document structure.
 */
function tagSignature(html: string): string[] {
  const result: string[] = [];
  for (const token of tokenizeTags(html)) {
    if (token.selfClosing) continue;
    if (!token.closing) {
      result.push(`+${token.name}`);
    } else if (result.length > 0 && result[result.length - 1] === `+${token.name}`) {
      result.pop();
    } else {
      result.push(`-${token.name}`);
    }
  }
  return result;
}

/**
 * The ordered sequence of table-structure tags in a fragment, e.g. ["tr", "td", "/td", "/tr"]. A self-closed
 * structural tag (`<td/>`) is equivalent to an empty open/close pair in XML and is recorded as such, so
 * expanding `<td/>` into `<td>…</td>` does not count as a structural change.
 */
function structuralSequence(html: string): string[] {
  const sequence: string[] = [];
  for (const token of tokenizeTags(html)) {
    if (!STRUCTURAL_TAGS.has(token.name)) continue;
    if (token.closing) {
      sequence.push(`/${token.name}`);
    } else {
      sequence.push(token.name);
      if (token.selfClosing) sequence.push(`/${token.name}`);
    }
  }
  return sequence;
}

/** Opening table-structure tags of a fragment, in order (used to compare span attributes between fragments). */
function structuralOpeningTokens(html: string): TagToken[] {
  return tokenizeTags(html).filter(token => STRUCTURAL_TAGS.has(token.name) && !token.closing);
}

function isSubsequence(needle: string[], haystack: string[]): boolean {
  let i = 0;
  for (const item of haystack) {
    if (i < needle.length && needle[i] === item) i++;
  }
  return i === needle.length;
}

function describeSignature(signature: string[]): string {
  return signature.length === 0
    ? "balanced"
    : signature.map(s => (s.startsWith("+") ? `unclosed <${s.slice(1)}>` : `stray </${s.slice(1)}>`)).join(", ");
}

/** A fragment inserted into a cell must be balanced: every tag it opens must be closed within it. */
function assertBalancedFragment(fragment: string, label: string): void {
  const signature = tagSignature(fragment);
  if (signature.length > 0) {
    throw new ConfluenceFragmentUpdateError(
      `${label} is not well-formed XHTML (${describeSignature(signature)}). Every tag must be closed within the fragment.`,
    );
  }
}

/** A fragment may only contain table-structure tags as part of a complete nested `<table>` it introduces itself. */
function assertNoStrayStructuralTags(fragment: string, label: string): void {
  let tableDepth = 0;
  for (const token of tokenizeTags(fragment)) {
    if (token.name === "table") {
      if (!token.selfClosing) tableDepth += token.closing ? -1 : 1;
      continue;
    }
    if (STRUCTURAL_TAGS.has(token.name) && tableDepth === 0) {
      throw new ConfluenceFragmentUpdateError(
        `${label} contains <${token.closing ? "/" : ""}${token.name}> outside of a complete nested <table>. Fragments must not add, remove or move table rows/cells of the existing page.`,
      );
    }
  }
}

/**
 * Finds every element with one of the given tag names, including nested ones, by scanning start/end
 * tags with a stack. Comments and CDATA sections are skipped (their contents are text, not markup), using
 * the same rule as {@link tokenizeTags} so the locator and the validators always see the same structure.
 * Malformed (unclosed) tags are ignored rather than throwing.
 */
function findElementSpans(html: string, tagNames: string[]): ElementSpan[] {
  const namePattern = tagNames.map(escapeRegExp).join("|");
  const tagRegex = new RegExp(
    `${OPAQUE_SECTION_PATTERN}|<(/?)(?:${namePattern})(?=[\\s/>])${TAG_ATTRS_PATTERN}>`,
    "gi",
  );
  const stack: { start: number; innerStart: number }[] = [];
  const spans: ElementSpan[] = [];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    if (match[1] === undefined) continue; // comment / CDATA section
    const isClosing = match[1] === "/";
    const tagText = match[0];
    const tagStart = match.index;
    const tagEnd = tagStart + tagText.length;

    if (isClosing) {
      const open = stack.pop();
      if (!open) continue;
      spans.push({
        start: open.start,
        end: tagEnd,
        innerStart: open.innerStart,
        innerEnd: tagStart,
        depth: stack.length,
      });
    } else if (tagText.endsWith("/>")) {
      spans.push({ start: tagStart, end: tagEnd, innerStart: tagEnd, innerEnd: tagEnd, depth: stack.length });
    } else {
      stack.push({ start: tagStart, innerStart: tagEnd });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}

function stripTagsAndNormalise(html: string): string {
  return html
    .replace(ANY_TAG_REGEX, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findAllOccurrences(body: string, needle: string): number[] {
  const indices: number[] = [];
  let index = body.indexOf(needle);
  while (index !== -1) {
    indices.push(index);
    index = body.indexOf(needle, index + needle.length);
  }
  return indices;
}

/** A half-open `[start, end)` character range of the body. */
type Region = { start: number; end: number };

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

function headingLevel(body: string, heading: ElementSpan): number {
  const match = /^<h([1-6])/i.exec(body.slice(heading.start, heading.innerStart));
  return match ? parseInt(match[1], 10) : 6;
}

/**
 * Resolves the region(s) of the page a `parentSectionAnchor` refers to. When an occurrence of the anchor sits inside
 * a heading, the region runs from that heading up to (not including) the next heading of the same or a higher
 * level, i.e. the whole subtree of subsections beneath it. An occurrence outside any heading yields a region from
 * the occurrence to the end of the page. Distinct regions are returned in document order.
 */
function resolveParentRegions(body: string, parentSectionAnchor: string): Region[] {
  const occurrences = findAllOccurrences(body, parentSectionAnchor);
  if (occurrences.length === 0) {
    throw new ConfluenceFragmentUpdateError(
      `parentSectionAnchor "${parentSectionAnchor}" was not found in the page body.`,
    );
  }
  const headings = findElementSpans(body, HEADING_TAGS);
  const regions: Region[] = [];
  for (const index of occurrences) {
    const heading = headings.find(h => h.start <= index && index < h.end);
    let region: Region;
    if (heading) {
      const level = headingLevel(body, heading);
      const next = headings.find(h => h.start >= heading.end && headingLevel(body, h) <= level);
      region = { start: heading.start, end: next ? next.start : body.length };
    } else {
      region = { start: index, end: body.length };
    }
    if (!regions.some(r => r.start === region.start && r.end === region.end)) regions.push(region);
  }
  return regions;
}

/** Resolves `parentSectionAnchor` to exactly one region, for scopes that cannot span several candidates. */
function resolveSingleParentRegion(body: string, parentSectionAnchor: string | undefined): Region {
  if (parentSectionAnchor === undefined || parentSectionAnchor === "") return { start: 0, end: body.length };
  const regions = resolveParentRegions(body, parentSectionAnchor);
  if (regions.length > 1) {
    throw new ConfluenceFragmentUpdateError(
      `parentSectionAnchor "${parentSectionAnchor}" occurs ${regions.length} times on the page. Use more specific text, e.g. the full heading markup such as "<h2>${parentSectionAnchor}</h2>".`,
    );
  }
  return regions[0];
}

/** Resolves the start of a replacement scope: the first occurrence of `sectionAnchor` inside `region`. */
function resolveSearchStart(body: string, sectionAnchor: string | undefined, region: Region): number {
  if (sectionAnchor === undefined || sectionAnchor === "") return region.start;
  const index = body.indexOf(sectionAnchor, region.start);
  if (index === -1 || index >= region.end) {
    throw new ConfluenceFragmentUpdateError(
      region.start === 0 && region.end === body.length
        ? `sectionAnchor "${sectionAnchor}" was not found in the page body.`
        : `sectionAnchor "${sectionAnchor}" was not found inside the parentSectionAnchor region.`,
    );
  }
  return index;
}

/**
 * Resolves the (exclusive) end of a replacement scope: the first occurrence of `sectionEndAnchor` that starts
 * after the `sectionAnchor` text and lies inside `region`. Without an end anchor the scope runs to the end of the
 * region (the end of the page when there is no parentSectionAnchor), as before.
 */
function resolveSearchEnd(
  body: string,
  sectionEndAnchor: string | undefined,
  scopeStart: number,
  sectionAnchor: string | undefined,
  region: Region,
): number {
  if (sectionEndAnchor === undefined) return region.end;
  const searchFrom = scopeStart + (sectionAnchor?.length ?? 0);
  const index = body.indexOf(sectionEndAnchor, searchFrom);
  if (index === -1 || index >= region.end) {
    const where = region.start === 0 && region.end === body.length ? "the page body" : "the parentSectionAnchor region";
    throw new ConfluenceFragmentUpdateError(
      sectionAnchor
        ? `sectionEndAnchor "${sectionEndAnchor}" was not found after sectionAnchor "${sectionAnchor}" in ${where}.`
        : `sectionEndAnchor "${sectionEndAnchor}" was not found in ${where}.`,
    );
  }
  return index;
}

/**
 * Normalises a zero-based index parameter (`columnIndex`, `occurrence`, `rowOccurrence`) to a non-negative integer.
 *
 * The generated Zod schemas declare these as `z.coerce.number().int()`, but `invokeAction` validates and then hands
 * the *original* parameters to the action, so an LLM-emitted `"1"` reaches this module as a string. Digit-only
 * strings are therefore accepted here; anything else (negative, fractional, empty, non-numeric) is rejected rather
 * than being silently coerced to 0.
 */
function normaliseIndex(value: unknown, name: string): number {
  const numeric = typeof value === "string" && /^\s*\d+\s*$/.test(value) ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isInteger(numeric) || numeric < 0) {
    throw new ConfluenceFragmentUpdateError(`${name} must be a non-negative integer (got ${JSON.stringify(value)}).`);
  }
  return numeric;
}

/** Picks the `rowOccurrence`-th row out of the candidate rows (already in document order). */
function pickRowOccurrence(rows: ElementSpan[], rowOccurrence: number, rowAnchor: string, where: string): ElementSpan {
  const index = normaliseIndex(rowOccurrence, "rowOccurrence");
  const row = rows[index];
  if (!row) {
    throw new ConfluenceFragmentUpdateError(
      `rowAnchor "${rowAnchor}" matched ${rows.length} table row(s) ${where}; rowOccurrence ${index} is out of range.`,
    );
  }
  return row;
}

/** Human-readable name of the section scope, used in error messages. */
function describeSection(sectionAnchor: string | undefined, parentSectionAnchor: string | undefined): string {
  if (sectionAnchor && parentSectionAnchor) {
    return `sectionAnchor "${sectionAnchor}" within parentSectionAnchor "${parentSectionAnchor}"`;
  }
  return sectionAnchor ? `sectionAnchor "${sectionAnchor}"` : `parentSectionAnchor "${parentSectionAnchor}"`;
}

/**
 * Resolves the top-level tables a section refers to. For every occurrence of `sectionAnchor`, the section table is
 * the top-level table containing that occurrence, or else the first top-level table that starts after it. When a
 * `parentSectionAnchor` is given, only occurrences and tables inside that parent's region(s) are considered; with a
 * parent but no `sectionAnchor`, every top-level table in the region(s) is a candidate. Returns the distinct
 * candidates in document order.
 */
function resolveSectionTables(
  body: string,
  sectionAnchor: string | undefined,
  parentSectionAnchor: string | undefined,
): ElementSpan[] {
  const regions = parentSectionAnchor
    ? resolveParentRegions(body, parentSectionAnchor)
    : [{ start: 0, end: body.length }];
  const inRegion = (index: number) => regions.find(r => r.start <= index && index < r.end);
  const topLevelTables = findElementSpans(body, ["table"]).filter(table => table.depth === 0);
  const candidates: ElementSpan[] = [];

  if (sectionAnchor) {
    const occurrences = findAllOccurrences(body, sectionAnchor).filter(index => inRegion(index) !== undefined);
    if (occurrences.length === 0) {
      throw new ConfluenceFragmentUpdateError(
        parentSectionAnchor
          ? `sectionAnchor "${sectionAnchor}" was not found inside the region of parentSectionAnchor "${parentSectionAnchor}".`
          : `sectionAnchor "${sectionAnchor}" was not found in the page body.`,
      );
    }
    for (const index of occurrences) {
      const region = inRegion(index)!;
      const table =
        topLevelTables.find(t => t.start <= index && index < t.end) ??
        topLevelTables.find(t => t.start >= index && t.end <= region.end);
      if (table && !candidates.includes(table)) candidates.push(table);
    }
    if (candidates.length === 0) {
      throw new ConfluenceFragmentUpdateError(
        `${describeSection(sectionAnchor, parentSectionAnchor)} was found, but there is no table at or after it${parentSectionAnchor ? " within that parent section" : " on the page"}.`,
      );
    }
    return candidates;
  }

  for (const region of regions) {
    for (const table of topLevelTables) {
      if (table.start >= region.start && table.end <= region.end && !candidates.includes(table)) candidates.push(table);
    }
  }
  if (candidates.length === 0) {
    throw new ConfluenceFragmentUpdateError(
      `parentSectionAnchor "${parentSectionAnchor}" was found, but there is no table inside its section.`,
    );
  }
  return candidates;
}

function innermostRowsContaining(body: string, rows: ElementSpan[], rowAnchor: string): ElementSpan[] {
  const containing = rows.filter(row => body.slice(row.start, row.end).includes(rowAnchor));
  // Keep only the innermost rows: drop any row that fully contains another matching row (nested tables).
  return containing.filter(
    outer => !containing.some(inner => inner !== outer && inner.start >= outer.start && inner.end <= outer.end),
  );
}

/**
 * Locates the single table row (`<tr>`) that contains `rowAnchor`. If the anchor appears inside a nested
 * table, the innermost row containing it is returned.
 *
 * Without `sectionAnchor` / `parentSectionAnchor` the whole page is searched. Otherwise only the table(s) identified
 * by those anchors are searched (see {@link resolveSectionTables}). In both cases the match must be unique:
 * more than one candidate row is rejected as ambiguous rather than silently picking one — unless the caller
 * explicitly selects one with `rowOccurrence` (zero-based, document order across the searched tables).
 */
export function locateTableRow(body: string, rowAnchor: string, options: ConfluenceRowTargetOptions = {}): ElementSpan {
  if (!rowAnchor) {
    throw new ConfluenceFragmentUpdateError("rowAnchor must be a non-empty string.");
  }
  const { rowOccurrence } = options;
  const sectionAnchor = options.sectionAnchor || undefined;
  const parentSectionAnchor = options.parentSectionAnchor || undefined;
  const allRows = findElementSpans(body, ["tr"]);

  if (sectionAnchor === undefined && parentSectionAnchor === undefined) {
    const leaves = innermostRowsContaining(body, allRows, rowAnchor);
    if (leaves.length === 0) {
      throw new ConfluenceFragmentUpdateError(`No table row containing rowAnchor "${rowAnchor}" was found.`);
    }
    if (rowOccurrence !== undefined) {
      return pickRowOccurrence(leaves, rowOccurrence, rowAnchor, "on the page");
    }
    if (leaves.length > 1) {
      throw new ConfluenceFragmentUpdateError(
        `rowAnchor "${rowAnchor}" matched ${leaves.length} table rows. Provide a sectionAnchor (e.g. the heading markup immediately before the intended table), a more specific rowAnchor, or a rowOccurrence index.`,
      );
    }
    return leaves[0];
  }

  const section = describeSection(sectionAnchor, parentSectionAnchor);
  const sectionTables = resolveSectionTables(body, sectionAnchor, parentSectionAnchor);
  const matches: { table: ElementSpan; rows: ElementSpan[] }[] = [];
  for (const table of sectionTables) {
    const rowsInTable = allRows.filter(row => row.start >= table.start && row.end <= table.end);
    const leaves = innermostRowsContaining(body, rowsInTable, rowAnchor);
    if (leaves.length > 0) matches.push({ table, rows: leaves });
  }

  if (matches.length === 0) {
    throw new ConfluenceFragmentUpdateError(
      `No table row containing rowAnchor "${rowAnchor}" was found in the table(s) identified by ${section}.`,
    );
  }
  if (rowOccurrence !== undefined) {
    // Tables and the rows within them are already in document order, so flattening preserves it.
    const candidates = matches.flatMap(match => match.rows);
    return pickRowOccurrence(candidates, rowOccurrence, rowAnchor, `in the table(s) identified by ${section}`);
  }
  if (matches.length > 1) {
    const hint = sectionAnchor
      ? `Use a more specific sectionAnchor (e.g. include the heading markup, such as "<h3>${sectionAnchor}</h3>")${parentSectionAnchor ? "" : " or add a parentSectionAnchor"}.`
      : `Add a sectionAnchor to pick one table, or use a more specific parentSectionAnchor.`;
    const occurrenceNote = sectionAnchor
      ? `sectionAnchor "${sectionAnchor}" occurs ${findAllOccurrences(body, sectionAnchor).length} times on the page and `
      : "";
    throw new ConfluenceFragmentUpdateError(
      `${occurrenceNote}rowAnchor "${rowAnchor}" matches rows in ${matches.length} different tables${sectionAnchor ? "" : ` under ${section}`}. ${hint}`,
    );
  }
  if (matches[0].rows.length > 1) {
    throw new ConfluenceFragmentUpdateError(
      `rowAnchor "${rowAnchor}" matched ${matches[0].rows.length} rows in the table identified by ${section}. Provide a more specific rowAnchor or a rowOccurrence index.`,
    );
  }
  return matches[0].rows[0];
}

function findEnclosingTable(body: string, row: ElementSpan): ElementSpan | undefined {
  const tables = findElementSpans(body, ["table"]).filter(t => t.start <= row.start && t.end >= row.end);
  // Innermost enclosing table = the one that starts last.
  return tables.sort((a, b) => b.start - a.start)[0];
}

/** Returns the cells (`<td>`/`<th>`) that are direct children of the given row, in document order. */
function getDirectCells(body: string, row: ElementSpan): ElementSpan[] {
  const inner = body.slice(row.innerStart, row.innerEnd);
  return findElementSpans(inner, ["td", "th"])
    .filter(cell => cell.depth === 0)
    .map(cell => ({
      start: cell.start + row.innerStart,
      end: cell.end + row.innerStart,
      innerStart: cell.innerStart + row.innerStart,
      innerEnd: cell.innerEnd + row.innerStart,
      depth: cell.depth,
    }));
}

/**
 * Reads a numeric span attribute (`colspan`/`rowspan`) from a tag's attribute text; defaults to 1.
 * The attribute name must sit at a real attribute boundary (start of text or whitespace) so prefixed
 * names such as `data-colspan` are not mistaken for the real attribute.
 */
function parseSpan(attributeText: string, attribute: "colspan" | "rowspan"): number {
  const match = new RegExp(`(?:^|\\s)${attribute}\\s*=\\s*["']?(\\d+)`, "i").exec(attributeText);
  const value = match ? parseInt(match[1], 10) : 1;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** Reads a numeric span attribute (`colspan`/`rowspan`) from a cell's start tag; defaults to 1. */
function getSpan(body: string, cell: ElementSpan, attribute: "colspan" | "rowspan"): number {
  return parseSpan(body.slice(cell.start, cell.innerStart), attribute);
}

/** True when the element was written as a self-closed tag such as `<td/>` (zero-width inner content). */
function isSelfClosed(body: string, element: ElementSpan): boolean {
  return element.innerStart === element.innerEnd && body.slice(element.start, element.end).endsWith("/>");
}

/** Rows that belong directly to `table` (not to a table nested inside one of its cells). */
function getDirectRows(body: string, table: ElementSpan): ElementSpan[] {
  return findElementSpans(body, ["tr"]).filter(row => {
    if (row.start < table.start || row.end > table.end) return false;
    const enclosing = findEnclosingTable(body, row);
    return enclosing !== undefined && enclosing.start === table.start;
  });
}

/**
 * Resolves the target cell of a row, either by physical `columnIndex` or by `columnHeader`. Header lookup
 * maps the header cell to a *logical* column (accounting for `colspan` in the header and target rows) so
 * merged headers cannot misroute the edit. Tables using `rowspan` cannot be resolved by header reliably and
 * are rejected with a hint to use `columnIndex`.
 */
function resolveTargetCell(body: string, row: ElementSpan, update: ConfluenceTableCellUpdate): ElementSpan {
  if (update.columnIndex !== undefined && update.columnHeader !== undefined) {
    throw new ConfluenceFragmentUpdateError(
      "Provide either columnHeader or columnIndex for a table cell update, not both.",
    );
  }
  const cells = getDirectCells(body, row);

  if (update.columnIndex !== undefined) {
    const columnIndex = normaliseIndex(update.columnIndex, "columnIndex");
    const cell = cells[columnIndex];
    if (!cell) {
      throw new ConfluenceFragmentUpdateError(
        `Row matching "${update.rowAnchor}" has ${cells.length} cell(s); columnIndex ${columnIndex} is out of range.`,
      );
    }
    return cell;
  }

  if (update.columnHeader === undefined || update.columnHeader === "") {
    throw new ConfluenceFragmentUpdateError("A table cell update requires either columnHeader or columnIndex.");
  }

  const table = findEnclosingTable(body, row);
  if (!table) {
    throw new ConfluenceFragmentUpdateError(
      `Could not find the <table> enclosing the row matching "${update.rowAnchor}".`,
    );
  }

  const tableRows = getDirectRows(body, table);
  const usesRowspan = tableRows.some(r => getDirectCells(body, r).some(c => getSpan(body, c, "rowspan") > 1));
  if (usesRowspan) {
    throw new ConfluenceFragmentUpdateError(
      `The table containing "${update.rowAnchor}" uses rowspan (vertically merged cells), so columnHeader "${update.columnHeader}" cannot be mapped to a cell reliably. Use columnIndex instead.`,
    );
  }

  const headerRow = tableRows.find(r => /<th[\s>]/i.test(body.slice(r.innerStart, r.innerEnd)));
  if (!headerRow) {
    throw new ConfluenceFragmentUpdateError(
      `The table containing "${update.rowAnchor}" has no header row (<th> cells), so columnHeader "${update.columnHeader}" cannot be resolved. Use columnIndex instead.`,
    );
  }

  // Map header cells to logical column positions, honouring colspan.
  const wanted = stripTagsAndNormalise(update.columnHeader);
  const headerCells = getDirectCells(body, headerRow);
  let logicalColumn = -1;
  let position = 0;
  const available: string[] = [];
  for (const headerCell of headerCells) {
    const text = stripTagsAndNormalise(body.slice(headerCell.innerStart, headerCell.innerEnd));
    const span = getSpan(body, headerCell, "colspan");
    available.push(text);
    if (text === wanted) {
      if (logicalColumn !== -1) {
        throw new ConfluenceFragmentUpdateError(
          `columnHeader "${update.columnHeader}" matches more than one header cell. Use columnIndex instead.`,
        );
      }
      if (span > 1) {
        throw new ConfluenceFragmentUpdateError(
          `Header "${update.columnHeader}" spans ${span} columns, so it does not identify a single cell. Use columnIndex instead.`,
        );
      }
      logicalColumn = position;
    }
    position += span;
  }
  if (logicalColumn === -1) {
    throw new ConfluenceFragmentUpdateError(
      `No column with header "${update.columnHeader}" found. Available headers: ${available.map(h => `"${h}"`).join(", ")}.`,
    );
  }

  // Find the physical cell in the target row that covers that logical column, honouring colspan.
  position = 0;
  for (const cell of cells) {
    const span = getSpan(body, cell, "colspan");
    if (logicalColumn >= position && logicalColumn < position + span) return cell;
    position += span;
  }
  throw new ConfluenceFragmentUpdateError(
    `Row matching "${update.rowAnchor}" has no cell under header "${update.columnHeader}" (logical column ${logicalColumn}, row covers ${position} column(s)).`,
  );
}

function applyTableCellUpdate(body: string, update: ConfluenceTableCellUpdate): string {
  assertBalancedFragment(update.newContent, "newContent");
  assertNoStrayStructuralTags(update.newContent, "newContent");

  const row = locateTableRow(body, update.rowAnchor, update);
  const cell = resolveTargetCell(body, row, update);

  const existing = body.slice(cell.innerStart, cell.innerEnd);
  const mode = update.mode ?? "replace";
  const content =
    mode === "append"
      ? existing + update.newContent
      : mode === "prepend"
        ? update.newContent + existing
        : update.newContent;

  if (isSelfClosed(body, cell)) {
    // `<td attrs/>` has nowhere to put content; expand it to `<td attrs>content</td>` in place.
    const tag = body.slice(cell.start, cell.end);
    const nameMatch = /^<([a-zA-Z][\w:.-]*)/.exec(tag);
    const tagName = nameMatch ? nameMatch[1] : "td";
    const openTag = `${tag.slice(0, -2).trimEnd()}>`;
    return body.slice(0, cell.start) + openTag + content + `</${tagName}>` + body.slice(cell.end);
  }

  return body.slice(0, cell.innerStart) + content + body.slice(cell.innerEnd);
}

/**
 * A replacement may not change the net tag structure of the page. Concretely:
 *  - `find` and `replace` must leave the same tags open/closed (equal tag signatures), and
 *  - if `find` touches table-structure tags, `replace` must contain exactly the same structural tags in the
 *    same order with the same `colspan`/`rowspan` (other attributes such as `class` may change, but cells/rows
 *    cannot be merged, split, added, removed or re-spanned);
 *  - otherwise `replace` may only introduce table tags as complete nested tables (see
 *    {@link assertNoStrayStructuralTags}); its balance is already guaranteed by the signature check.
 */
function assertReplacementPreservesStructure(replacement: ConfluenceReplacement): void {
  const findSignature = tagSignature(replacement.find);
  const replaceSignature = tagSignature(replacement.replace);
  if (findSignature.join(" ") !== replaceSignature.join(" ")) {
    throw new ConfluenceFragmentUpdateError(
      `Replacement of "${truncate(replacement.find)}" would change the tag structure of the page (find is ${describeSignature(findSignature)}; replace is ${describeSignature(replaceSignature)}). Both must open and close the same tags.`,
    );
  }

  const findStructure = structuralSequence(replacement.find);
  if (findStructure.length > 0) {
    const replaceStructure = structuralSequence(replacement.replace);
    if (findStructure.join(" ") !== replaceStructure.join(" ")) {
      throw new ConfluenceFragmentUpdateError(
        `Replacement of "${truncate(replacement.find)}" would alter table structure (rows/cells) of the page. Table tags in find and replace must be identical; use tableCellUpdates to change cell content.`,
      );
    }

    // Same tags in the same order: now make sure no cell changes how many columns/rows it spans.
    const findTokens = structuralOpeningTokens(replacement.find);
    const replaceTokens = structuralOpeningTokens(replacement.replace);
    for (let i = 0; i < findTokens.length; i++) {
      for (const attribute of ["colspan", "rowspan"] as const) {
        const before = parseSpan(findTokens[i].attrs, attribute);
        const after = parseSpan(replaceTokens[i].attrs, attribute);
        if (before !== after) {
          throw new ConfluenceFragmentUpdateError(
            `Replacement of "${truncate(replacement.find)}" would change ${attribute} of a <${findTokens[i].name}> from ${before} to ${after}, reshaping the table grid. Merged-cell layout cannot be changed by this action; use tableCellUpdates to change cell content.`,
          );
        }
      }
    }
  } else {
    assertNoStrayStructuralTags(replacement.replace, `Replacement text for "${truncate(replacement.find)}"`);
  }
}

function applyReplacement(body: string, replacement: ConfluenceReplacement): { body: string; count: number } {
  if (!replacement.find) {
    throw new ConfluenceFragmentUpdateError("Replacement `find` must be a non-empty string.");
  }
  assertReplacementPreservesStructure(replacement);
  let occurrence: number | undefined;
  if (replacement.occurrence !== undefined) {
    if (replacement.replaceAll) {
      throw new ConfluenceFragmentUpdateError(
        `Replacement of "${truncate(replacement.find)}": provide either occurrence or replaceAll, not both.`,
      );
    }
    occurrence = normaliseIndex(replacement.occurrence, "occurrence");
  }
  if (replacement.sectionEndAnchor === "") {
    // An empty boundary would match nothing sensible; treating it as absent would silently widen the scope to the
    // rest of the page, which is exactly what a caller supplying an end anchor is trying to prevent.
    throw new ConfluenceFragmentUpdateError(
      `Replacement of "${truncate(replacement.find)}": sectionEndAnchor must be a non-empty string.`,
    );
  }
  if (replacement.rowAnchor && replacement.sectionEndAnchor) {
    throw new ConfluenceFragmentUpdateError(
      `Replacement of "${truncate(replacement.find)}": sectionEndAnchor cannot be combined with rowAnchor (the scope is already the single row).`,
    );
  }
  if (replacement.rowOccurrence !== undefined && !replacement.rowAnchor) {
    // Never ignore a targeting parameter: doing so would silently widen the scope to the page/section.
    throw new ConfluenceFragmentUpdateError(
      `Replacement of "${truncate(replacement.find)}": rowOccurrence requires a rowAnchor to select rows from.`,
    );
  }

  // Scope the replacement to a single row if requested, otherwise to the body between sectionAnchor (or the
  // start of the page) and sectionEndAnchor (or the end of the page).
  let scopeStart = 0;
  let scopeEnd = body.length;
  if (replacement.rowAnchor) {
    const row = locateTableRow(body, replacement.rowAnchor, replacement);
    scopeStart = row.start;
    scopeEnd = row.end;
  } else {
    // A parentSectionAnchor narrows the page to one heading's region first; the section anchors then work inside it.
    const region = resolveSingleParentRegion(body, replacement.parentSectionAnchor);
    scopeStart = resolveSearchStart(body, replacement.sectionAnchor, region);
    scopeEnd = resolveSearchEnd(body, replacement.sectionEndAnchor, scopeStart, replacement.sectionAnchor, region);
  }

  const scope = body.slice(scopeStart, scopeEnd);
  const area = replacement.parentSectionAnchor
    ? `the section under parentSectionAnchor "${replacement.parentSectionAnchor}"`
    : "the page body";
  const scopeDescription = replacement.rowAnchor
    ? `the table row matching "${replacement.rowAnchor}"`
    : replacement.sectionAnchor && replacement.sectionEndAnchor
      ? `${area} between sectionAnchor "${replacement.sectionAnchor}" and sectionEndAnchor "${replacement.sectionEndAnchor}"`
      : replacement.sectionAnchor
        ? `${area} after sectionAnchor "${replacement.sectionAnchor}"`
        : replacement.sectionEndAnchor
          ? `${area} before sectionEndAnchor "${replacement.sectionEndAnchor}"`
          : area;

  const occurrences = findAllOccurrences(scope, replacement.find);
  if (occurrences.length === 0) {
    throw new ConfluenceFragmentUpdateError(
      `Replacement text "${truncate(replacement.find)}" was not found in ${scopeDescription}. No changes were made.`,
    );
  }

  let count: number;
  let updatedScope: string;
  if (replacement.replaceAll) {
    updatedScope = scope.split(replacement.find).join(replacement.replace);
    count = occurrences.length;
  } else {
    const target = occurrence ?? 0;
    const index = occurrences[target];
    if (index === undefined) {
      throw new ConfluenceFragmentUpdateError(
        `Replacement text "${truncate(replacement.find)}" occurs ${occurrences.length} time(s) in ${scopeDescription}; occurrence ${target} is out of range.`,
      );
    }
    updatedScope = scope.slice(0, index) + replacement.replace + scope.slice(index + replacement.find.length);
    count = 1;
  }

  return { body: body.slice(0, scopeStart) + updatedScope + body.slice(scopeEnd), count };
}

function truncate(value: string, max = 80): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Applies all requested fragment updates to a storage-format body and validates the result.
 * Throws {@link ConfluenceFragmentUpdateError} (and leaves the caller's page untouched) if any
 * update cannot be applied, if a required marker is missing afterwards, or if the table skeleton
 * of the original page did not survive intact.
 */
export function applyConfluenceFragmentUpdates(
  body: string,
  input: ConfluenceFragmentUpdateInput,
): ConfluenceFragmentUpdateResult {
  const tableCellUpdates = input.tableCellUpdates ?? [];
  const replacements = input.replacements ?? [];

  if (tableCellUpdates.length === 0 && replacements.length === 0) {
    throw new ConfluenceFragmentUpdateError("At least one tableCellUpdate or replacement must be provided.");
  }

  let updated = body;
  let cellsUpdated = 0;
  let replacementsApplied = 0;

  for (const update of tableCellUpdates) {
    updated = applyTableCellUpdate(updated, update);
    cellsUpdated += 1;
  }

  for (const replacement of replacements) {
    const result = applyReplacement(updated, replacement);
    updated = result.body;
    replacementsApplied += result.count;
  }

  const missingMarkers = (input.requiredMarkers ?? []).filter(marker => marker !== "" && !updated.includes(marker));
  if (missingMarkers.length > 0) {
    throw new ConfluenceFragmentUpdateError(
      `Refusing to save: the updated page would be missing required marker(s): ${missingMarkers.map(m => `"${m}"`).join(", ")}.`,
    );
  }

  // Global structural check: every table/row/cell tag of the original page must still be present, in the same
  // order. New complete tables may have been inserted inside cells, but nothing pre-existing may be lost.
  const originalSkeleton = structuralSequence(body);
  const updatedSkeleton = structuralSequence(updated);
  if (!isSubsequence(originalSkeleton, updatedSkeleton)) {
    throw new ConfluenceFragmentUpdateError(
      `Refusing to save: the update would remove or reorder table structure of the page (${originalSkeleton.length} table tags before, ${updatedSkeleton.length} after). Check that the edits do not break <table>/<tr>/<td> markup.`,
    );
  }

  // The overall page must remain well-formed too (an edit can only ever be balanced, so this guards against
  // surprising inputs such as a `find` that itself was unbalanced in the original page).
  const beforeSignature = tagSignature(body).join(" ");
  const afterSignature = tagSignature(updated).join(" ");
  if (beforeSignature !== afterSignature) {
    throw new ConfluenceFragmentUpdateError(
      "Refusing to save: the update would change which tags are left open or closed in the page body.",
    );
  }

  return { body: updated, cellsUpdated, replacementsApplied };
}
