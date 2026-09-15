/**
 * Deterministic, string-based editing of Confluence storage-format (XHTML) page bodies.
 *
 * The goal of this module is to let a caller (typically an LLM agent) update a small part of a
 * large Confluence page — a single table cell, a row, or an exact snippet — without ever having
 * to carry and re-emit the full page body. Everything outside the targeted fragment is preserved
 * byte-for-byte: the body is never parsed and re-serialised, so macros, user mentions, colgroups,
 * emoticons, etc. survive untouched.
 */

export type ConfluenceTableCellUpdate = {
  rowAnchor: string;
  sectionAnchor?: string;
  columnHeader?: string;
  columnIndex?: number;
  newContent: string;
  mode?: "replace" | "append" | "prepend";
};

export type ConfluenceReplacement = {
  find: string;
  replace: string;
  replaceAll?: boolean;
  rowAnchor?: string;
  sectionAnchor?: string;
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds every element with one of the given tag names, including nested ones, by scanning start/end
 * tags with a stack. Malformed (unclosed) tags are ignored rather than throwing.
 */
function findElementSpans(html: string, tagNames: string[]): ElementSpan[] {
  const namePattern = tagNames.map(escapeRegExp).join("|");
  const tagRegex = new RegExp(`<(/?)(?:${namePattern})(?=[\\s/>])[^>]*>`, "gi");
  const stack: { start: number; innerStart: number }[] = [];
  const spans: ElementSpan[] = [];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
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
    .replace(/<[^>]*>/g, " ")
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

function resolveSearchStart(body: string, sectionAnchor: string | undefined): number {
  if (sectionAnchor === undefined || sectionAnchor === "") return 0;
  const index = body.indexOf(sectionAnchor);
  if (index === -1) {
    throw new ConfluenceFragmentUpdateError(`sectionAnchor "${sectionAnchor}" was not found in the page body.`);
  }
  return index;
}

/**
 * Locates the table row (`<tr>`) that contains `rowAnchor`. If the anchor appears inside a nested
 * table, the innermost row containing it is returned. When several unrelated rows contain the anchor,
 * the first one at/after `sectionAnchor` is used if a section anchor was given; otherwise the match
 * is considered ambiguous and an error is thrown.
 */
export function locateTableRow(body: string, rowAnchor: string, sectionAnchor?: string): ElementSpan {
  if (!rowAnchor) {
    throw new ConfluenceFragmentUpdateError("rowAnchor must be a non-empty string.");
  }
  const searchStart = resolveSearchStart(body, sectionAnchor);
  const rows = findElementSpans(body, ["tr"]).filter(row => row.end > searchStart);

  const containing = rows.filter(row => body.slice(row.start, row.end).includes(rowAnchor));
  // Keep only the innermost rows: drop any row that fully contains another matching row.
  const leaves = containing.filter(
    outer => !containing.some(inner => inner !== outer && inner.start >= outer.start && inner.end <= outer.end),
  );

  if (leaves.length === 0) {
    throw new ConfluenceFragmentUpdateError(
      `No table row containing rowAnchor "${rowAnchor}" was found${sectionAnchor ? ` after sectionAnchor "${sectionAnchor}"` : ""}.`,
    );
  }
  if (leaves.length > 1 && !sectionAnchor) {
    throw new ConfluenceFragmentUpdateError(
      `rowAnchor "${rowAnchor}" matched ${leaves.length} table rows. Provide a sectionAnchor (text that appears immediately before the intended table) or a more specific rowAnchor.`,
    );
  }
  return leaves[0];
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

function resolveColumnIndex(body: string, row: ElementSpan, update: ConfluenceTableCellUpdate): number {
  if (update.columnIndex !== undefined && update.columnHeader !== undefined) {
    throw new ConfluenceFragmentUpdateError(
      "Provide either columnHeader or columnIndex for a table cell update, not both.",
    );
  }
  if (update.columnIndex !== undefined) {
    if (!Number.isInteger(update.columnIndex) || update.columnIndex < 0) {
      throw new ConfluenceFragmentUpdateError(
        `columnIndex must be a non-negative integer (got ${update.columnIndex}).`,
      );
    }
    return update.columnIndex;
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
  const headerRow = findElementSpans(body, ["tr"]).find(
    r => r.start >= table.start && r.end <= table.end && /<th[\s>]/i.test(body.slice(r.innerStart, r.innerEnd)),
  );
  if (!headerRow) {
    throw new ConfluenceFragmentUpdateError(
      `The table containing "${update.rowAnchor}" has no header row (<th> cells), so columnHeader "${update.columnHeader}" cannot be resolved. Use columnIndex instead.`,
    );
  }

  const wanted = stripTagsAndNormalise(update.columnHeader);
  const headerCells = getDirectCells(body, headerRow);
  const index = headerCells.findIndex(
    cell => stripTagsAndNormalise(body.slice(cell.innerStart, cell.innerEnd)) === wanted,
  );
  if (index === -1) {
    const available = headerCells.map(cell => stripTagsAndNormalise(body.slice(cell.innerStart, cell.innerEnd)));
    throw new ConfluenceFragmentUpdateError(
      `No column with header "${update.columnHeader}" found. Available headers: ${available.map(h => `"${h}"`).join(", ")}.`,
    );
  }
  return index;
}

function applyTableCellUpdate(body: string, update: ConfluenceTableCellUpdate): string {
  const row = locateTableRow(body, update.rowAnchor, update.sectionAnchor);
  const columnIndex = resolveColumnIndex(body, row, update);
  const cells = getDirectCells(body, row);
  const cell = cells[columnIndex];
  if (!cell) {
    throw new ConfluenceFragmentUpdateError(
      `Row matching "${update.rowAnchor}" has ${cells.length} cell(s); columnIndex ${columnIndex} is out of range.`,
    );
  }

  const existing = body.slice(cell.innerStart, cell.innerEnd);
  const mode = update.mode ?? "replace";
  const content =
    mode === "append"
      ? existing + update.newContent
      : mode === "prepend"
        ? update.newContent + existing
        : update.newContent;

  return body.slice(0, cell.innerStart) + content + body.slice(cell.innerEnd);
}

function applyReplacement(body: string, replacement: ConfluenceReplacement): { body: string; count: number } {
  if (!replacement.find) {
    throw new ConfluenceFragmentUpdateError("Replacement `find` must be a non-empty string.");
  }

  // Scope the replacement to a single row if requested, otherwise to the whole body (from sectionAnchor onwards).
  let scopeStart = 0;
  let scopeEnd = body.length;
  if (replacement.rowAnchor) {
    const row = locateTableRow(body, replacement.rowAnchor, replacement.sectionAnchor);
    scopeStart = row.start;
    scopeEnd = row.end;
  } else {
    scopeStart = resolveSearchStart(body, replacement.sectionAnchor);
  }

  const scope = body.slice(scopeStart, scopeEnd);
  let count = 0;
  let updatedScope: string;
  if (replacement.replaceAll) {
    updatedScope = scope.split(replacement.find).join(replacement.replace);
    count = scope.split(replacement.find).length - 1;
  } else {
    const index = scope.indexOf(replacement.find);
    if (index !== -1) {
      updatedScope = scope.slice(0, index) + replacement.replace + scope.slice(index + replacement.find.length);
      count = 1;
    } else {
      updatedScope = scope;
    }
  }

  if (count === 0) {
    const scopeDescription = replacement.rowAnchor
      ? `the table row matching "${replacement.rowAnchor}"`
      : replacement.sectionAnchor
        ? `the page body after sectionAnchor "${replacement.sectionAnchor}"`
        : "the page body";
    throw new ConfluenceFragmentUpdateError(
      `Replacement text "${truncate(replacement.find)}" was not found in ${scopeDescription}. No changes were made.`,
    );
  }

  return { body: body.slice(0, scopeStart) + updatedScope + body.slice(scopeEnd), count };
}

function truncate(value: string, max = 80): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Applies all requested fragment updates to a storage-format body and validates the result.
 * Throws {@link ConfluenceFragmentUpdateError} (and leaves the caller's page untouched) if any
 * update cannot be applied or if a required marker is missing afterwards.
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

  // Structural sanity check: targeted edits must never remove tables or rows from the page.
  const tableCountBefore = findElementSpans(body, ["table"]).length;
  const tableCountAfter = findElementSpans(updated, ["table"]).length;
  const rowCountBefore = findElementSpans(body, ["tr"]).length;
  const rowCountAfter = findElementSpans(updated, ["tr"]).length;
  if (tableCountAfter < tableCountBefore || rowCountAfter < rowCountBefore) {
    throw new ConfluenceFragmentUpdateError(
      `Refusing to save: the update would reduce the page from ${tableCountBefore} table(s)/${rowCountBefore} row(s) to ${tableCountAfter} table(s)/${rowCountAfter} row(s). Check that the new content does not remove or break table markup.`,
    );
  }

  return { body: updated, cellsUpdated, replacementsApplied };
}
