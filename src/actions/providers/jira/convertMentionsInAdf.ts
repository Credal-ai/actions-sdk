const JIRA_MENTION_SOURCE = "\\[~accountid:([^\\]]+)\\]";
const JIRA_MENTION_TEST = new RegExp(JIRA_MENTION_SOURCE);
const PLACEHOLDER_PREFIX = "\uFFFCMENTION_";
const PLACEHOLDER_SUFFIX = "\uFFFC";

/**
 * Extracts [~accountid:XXXXX] patterns from raw text and replaces them with
 * safe placeholders that won't be mangled by markdown parsers.
 *
 * Use with {@link insertMentionNodes} after markdown-to-ADF conversion.
 */
export function extractMentions(text: string): { sanitized: string; mentions: string[] } {
  const mentions: string[] = [];
  const sanitized = text.replace(new RegExp(JIRA_MENTION_SOURCE, "g"), (_match, id: string) => {
    const index = mentions.length;
    mentions.push(id);
    return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
  });
  return { sanitized, mentions };
}

/**
 * Walks an ADF tree and replaces placeholder tokens (produced by
 * {@link extractMentions}) with proper ADF mention nodes.
 */
export function insertMentionNodes(adf: unknown, mentions: string[]): unknown {
  if (mentions.length === 0) return adf;
  const placeholderRegex = new RegExp(`${escapeRegex(PLACEHOLDER_PREFIX)}(\\d+)${escapeRegex(PLACEHOLDER_SUFFIX)}`);
  return walkAndReplace(adf, placeholderRegex, mentions);
}

/**
 * Walks an ADF tree and converts raw [~accountid:XXXXX] text patterns into
 * ADF mention nodes. Works reliably for single mentions per paragraph; for
 * multiple mentions use extractMentions + insertMentionNodes instead.
 */
export function convertMentionsInAdf(adf: unknown): unknown {
  if (!adf || typeof adf !== "object") return adf;
  if (Array.isArray(adf))
    return adf.flatMap(item => {
      const result = convertMentionsInAdf(item);
      return Array.isArray(result) ? result : [result];
    });

  const node = adf as Record<string, unknown>;

  if (node.type === "text" && typeof node.text === "string" && JIRA_MENTION_TEST.test(node.text)) {
    return splitTextNodeWithMentions(node, new RegExp(JIRA_MENTION_SOURCE, "g"), (_match, groups) => groups[0]);
  }

  if (Array.isArray(node.content)) {
    const newContent: unknown[] = [];
    for (const child of node.content) {
      const result = convertMentionsInAdf(child);
      if (Array.isArray(result)) {
        newContent.push(...result);
      } else {
        newContent.push(result);
      }
    }
    return { ...node, content: newContent };
  }

  return node;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function walkAndReplace(adf: unknown, regex: RegExp, mentions: string[]): unknown {
  if (!adf || typeof adf !== "object") return adf;
  if (Array.isArray(adf))
    return adf.flatMap(item => {
      const result = walkAndReplace(item, regex, mentions);
      return Array.isArray(result) ? result : [result];
    });

  const node = adf as Record<string, unknown>;

  if (node.type === "text" && typeof node.text === "string" && regex.test(node.text)) {
    return splitTextNodeWithMentions(
      node,
      new RegExp(`${escapeRegex(PLACEHOLDER_PREFIX)}(\\d+)${escapeRegex(PLACEHOLDER_SUFFIX)}`, "g"),
      (_match, groups) => mentions[parseInt(groups[0], 10)],
    );
  }

  if (Array.isArray(node.content)) {
    const newContent: unknown[] = [];
    for (const child of node.content) {
      const result = walkAndReplace(child, regex, mentions);
      if (Array.isArray(result)) {
        newContent.push(...result);
      } else {
        newContent.push(result);
      }
    }
    return { ...node, content: newContent };
  }

  return node;
}

function splitTextNodeWithMentions(
  node: Record<string, unknown>,
  regex: RegExp,
  resolveId: (fullMatch: string, groups: string[]) => string,
): Record<string, unknown>[] {
  const text = node.text as string;
  const marks = node.marks as Array<Record<string, unknown>> | undefined;
  const results: Record<string, unknown>[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textNode: Record<string, unknown> = { type: "text", text: text.slice(lastIndex, match.index) };
      if (marks) textNode.marks = marks;
      results.push(textNode);
    }

    results.push({
      type: "mention",
      attrs: {
        id: resolveId(match[0], match.slice(1)),
        text: `@${resolveId(match[0], match.slice(1))}`,
        accessLevel: "",
      },
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const textNode: Record<string, unknown> = { type: "text", text: text.slice(lastIndex) };
    if (marks) textNode.marks = marks;
    results.push(textNode);
  }

  return results;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
