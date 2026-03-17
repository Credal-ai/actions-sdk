const JIRA_MENTION_TEST = /\[~accountid:([^\]]+)\]/;
const JIRA_MENTION_GLOBAL = /\[~accountid:([^\]]+)\]/g;

/**
 * Walks an ADF tree and converts [~accountid:XXXXX] text patterns into
 * proper ADF mention nodes so Jira Cloud renders them as clickable @mentions.
 */
export function convertMentionsInAdf(adf: unknown): unknown {
  if (!adf || typeof adf !== "object") return adf;
  if (Array.isArray(adf)) return adf.map(convertMentionsInAdf);

  const node = adf as Record<string, unknown>;

  if (node.type === "text" && typeof node.text === "string" && JIRA_MENTION_TEST.test(node.text)) {
    return splitTextNodeWithMentions(node);
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

function splitTextNodeWithMentions(node: Record<string, unknown>): Record<string, unknown>[] {
  const text = node.text as string;
  const marks = node.marks as Array<Record<string, unknown>> | undefined;
  const results: Record<string, unknown>[] = [];
  let lastIndex = 0;

  const regex = new RegExp(JIRA_MENTION_GLOBAL.source, "g");
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
        id: match[1],
        text: "@mentioned-user",
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
