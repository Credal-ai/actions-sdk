import type { docs_v1 } from "@googleapis/docs";
import { marked } from "marked";

export type GoogleDocContentFormat = "plain" | "html" | "markdown";

/** Maps heading level (1–6) to Google Docs namedStyleType. */
const HEADING_STYLE_MAP = {
  1: "HEADING_1",
  2: "HEADING_2",
  3: "HEADING_3",
  4: "HEADING_4",
  5: "HEADING_5",
  6: "HEADING_6",
} as const;

/** Google Docs bullet presets used by createParagraphBullets. */
const BULLET_PRESET = {
  UNORDERED: "BULLET_DISC_CIRCLE_SQUARE",
  ORDERED: "NUMBERED_DECIMAL_ALPHA_ROMAN",
} as const;

type BulletPreset = (typeof BULLET_PRESET)[keyof typeof BULLET_PRESET];
type HeadingLevel = keyof typeof HEADING_STYLE_MAP;

/**
 * Intermediate representation bridging HTML parsing and Google Docs API request generation.
 *
 * The Google Docs API doesn't accept HTML or Markdown directly — it requires explicit
 * batch requests (insertText, updateTextStyle, updateParagraphStyle, createParagraphBullets).
 * This IR lets us decouple the two concerns:
 *   1. parseHtmlContent() walks HTML and produces an array of these segments
 *   2. parseHtmlToDocRequests() transforms them into the specific API requests Google expects
 */
interface TextWithFormatting {
  text: string;
  formatting?: docs_v1.Schema$TextStyle;
  bulletPreset?: BulletPreset;
  headingLevel?: HeadingLevel;
}

/** Replaces common HTML entities (`&amp;`, `&lt;`, `&nbsp;`, etc.) with their literal characters. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Maps a heading level (1–6) to the corresponding Google Docs `namedStyleType` (e.g. 3 → "HEADING_3"). */
function getNamedStyleType(level: HeadingLevel): string {
  return HEADING_STYLE_MAP[level] ?? "HEADING_1";
}

/**
 * Builds the `fields` mask required by `updateTextStyle` from the keys present in a TextStyle.
 * E.g. `{ bold: true, link: { url: "..." } }` → `"bold,link"`.
 */
function fieldMaskFromTextStyle(style: docs_v1.Schema$TextStyle): string {
  return Object.keys(style).join(",");
}

const ALLOWED_URL_SCHEMES = /^https?:\/\//i;

/** Returns true if the URL uses a safe scheme (http/https). Rejects javascript:, data:, etc. */
function isSafeUrl(url: string): boolean {
  return ALLOWED_URL_SCHEMES.test(url.trim());
}

/** Removes all HTML tags and decodes entities. Used as a last-resort fallback when parsing yields no segments. */
function stripHtmlTags(content: string): string {
  return decodeHtmlEntities(content.replace(/<[^>]*>/g, ""));
}

/** Wraps plain text in a single `insertText` request at document index 1 (start of body). */
export function plainTextToDocRequests(content: string): docs_v1.Schema$Request[] {
  return [
    {
      insertText: {
        location: { index: 1 },
        text: content,
      },
    },
  ];
}

/**
 * Parses an HTML string into an array of `TextWithFormatting` segments.
 *
 * Strategy: split on HTML tags, walk segments sequentially, and maintain a mutable
 * formatting state (`currentFormatting`, `listStack`, `currentHeadingLevel`).
 * Opening tags push state (e.g. `<b>` sets `bold: true`), closing tags pop it.
 * Non-tag segments are emitted with a snapshot of the current state.
 *
 * Supported elements: `<b>/<strong>`, `<i>/<em>`, `<u>`, `<code>`, `<a href>`,
 * `<ul>/<ol>/<li>`, `<h1>`–`<h6>`, `<p>`, `<br>`.
 *
 * @example
 *   parseHtmlContent("<p><b>hello</b> world</p>")
 *   // → [{ text: "hello", formatting: { bold: true } }, { text: " world" }, { text: "\n" }]
 */
export function parseHtmlContent(html: string): TextWithFormatting[] {
  // Normalize <br> to newlines, then split into alternating [text, tag, text, tag, ...] segments.
  // The capturing group in the regex keeps the tags in the result array.
  const segments = html
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/(<[^>]+>)/)
    .filter(segment => segment.length > 0);

  const result: TextWithFormatting[] = [];
  // Mutable state that tracks currently active formatting as we walk through segments.
  // Opening tags add properties, closing tags delete them.
  const currentFormatting: docs_v1.Schema$TextStyle = {};
  // Stack to support nested lists — top of stack is the active bullet preset
  const listStack: BulletPreset[] = [];
  let currentHeadingLevel: HeadingLevel | undefined;

  for (const segment of segments) {
    // --- Text node: emit with a snapshot of the current formatting state ---
    if (!segment.startsWith("<")) {
      const decodedText = decodeHtmlEntities(segment);
      if (!decodedText) {
        continue;
      }
      // Skip newline-only text nodes — these are HTML formatting artifacts
      // We preserve spaces (e.g. " " between inline elements like </b> and <a>).
      if (/^\n+$/.test(decodedText)) {
        continue;
      }
      result.push({
        text: decodedText,
        formatting: Object.keys(currentFormatting).length > 0 ? { ...currentFormatting } : undefined,
        bulletPreset: listStack[listStack.length - 1],
        headingLevel: currentHeadingLevel,
      });
      continue;
    }

    // --- Character-level formatting: toggle on open, remove on close ---
    if (segment.match(/<\s*b\s*>/i) || segment.match(/<\s*strong\s*>/i)) {
      currentFormatting.bold = true;
      continue;
    }
    if (segment.match(/<\/\s*b\s*>/i) || segment.match(/<\/\s*strong\s*>/i)) {
      delete currentFormatting.bold;
      continue;
    }

    if (segment.match(/<\s*i\s*>/i) || segment.match(/<\s*em\s*>/i)) {
      currentFormatting.italic = true;
      continue;
    }
    if (segment.match(/<\/\s*i\s*>/i) || segment.match(/<\/\s*em\s*>/i)) {
      delete currentFormatting.italic;
      continue;
    }

    if (segment.match(/<\s*u\s*>/i)) {
      currentFormatting.underline = true;
      continue;
    }
    if (segment.match(/<\/\s*u\s*>/i)) {
      delete currentFormatting.underline;
      continue;
    }

    // Code: rendered as Courier New
    if (segment.match(/<\s*code[^>]*>/i)) {
      currentFormatting.weightedFontFamily = { fontFamily: "Courier New" };
      continue;
    }
    if (segment.match(/<\/\s*code\s*>/i)) {
      delete currentFormatting.weightedFontFamily;
      continue;
    }

    // Pre-formatted blocks: same monospace treatment as <code>, with trailing newline on close
    if (segment.match(/<\s*pre[^>]*>/i)) {
      currentFormatting.weightedFontFamily = { fontFamily: "Courier New" };
      continue;
    }
    if (segment.match(/<\/\s*pre\s*>/i)) {
      delete currentFormatting.weightedFontFamily;
      result.push({ text: "\n" });
      continue;
    }

    // --- Lists: stack-based to handle nesting (e.g. <ul> inside <ol>) ---
    if (segment.match(/<\s*ul[^>]*>/i)) {
      listStack.push(BULLET_PRESET.UNORDERED);
      continue;
    }
    if (segment.match(/<\s*ol[^>]*>/i)) {
      listStack.push(BULLET_PRESET.ORDERED);
      continue;
    }
    if (segment.match(/<\/\s*(ul|ol)\s*>/i)) {
      listStack.pop();
      result.push({ text: "\n" });
      continue;
    }

    // <li> open is a no-op; </li> emits a newline tagged with the current bullet preset
    // so parseHtmlToDocRequests knows which lines to apply createParagraphBullets to
    if (segment.match(/<\s*li[^>]*>/i)) {
      continue;
    }
    if (segment.match(/<\/\s*li\s*>/i)) {
      result.push({
        text: "\n",
        bulletPreset: listStack[listStack.length - 1],
      });
      continue;
    }

    // --- Block-level elements: emit newlines for paragraph breaks ---
    if (segment.match(/<\s*p[^>]*>/i)) {
      continue;
    }
    if (segment.match(/<\/\s*p\s*>/i)) {
      result.push({ text: "\n" });
      continue;
    }

    // --- Headings: set level on open, clear on close + emit newline ---
    const headingStart = segment.match(/<\s*h([1-6])[^>]*>/i);
    if (headingStart) {
      currentHeadingLevel = Number.parseInt(headingStart[1], 10) as HeadingLevel;
      continue;
    }
    if (segment.match(/<\/\s*h[1-6]\s*>/i)) {
      currentHeadingLevel = undefined;
      result.push({ text: "\n" });
      continue;
    }

    // --- Links: extract href on open, clear on close ---
    const linkStart = segment.match(/<\s*a[^>]*href=["']([^"']+)["'][^>]*>/i);
    if (linkStart) {
      const url = decodeHtmlEntities(linkStart[1]);
      if (isSafeUrl(url)) {
        // allow safe links only (javascript:, data:, etc. are rejected)
        currentFormatting.link = { url };
      }
      continue;
    }
    if (segment.match(/<\/\s*a\s*>/i)) {
      delete currentFormatting.link;
      continue;
    }
  }

  if (result.length === 0) {
    const text = stripHtmlTags(html);
    if (text) {
      result.push({ text });
    }
  }

  return result;
}

/**
 * Converts an HTML string into Google Docs API batch requests.
 *
 * Pipeline: HTML → `parseHtmlContent()` → TextWithFormatting[] → four request buckets:
 *   1. `insertText`            – insert each text segment sequentially starting at index 1
 *   2. `updateTextStyle`       – apply bold/italic/underline/link/code formatting
 *   3. `updateParagraphStyle`  – apply heading levels (HEADING_1–HEADING_6)
 *   4. `createParagraphBullets`– apply bullet/numbered list presets
 *
 * Requests are ordered inserts-first so that character indices remain valid when
 * style/bullet/heading requests reference them (styles are applied after all text is inserted).
 */
export function parseHtmlToDocRequests(htmlContent: string): docs_v1.Schema$Request[] {
  const textWithFormatting = parseHtmlContent(htmlContent);

  // Requests are collected into separate buckets because the Google Docs API
  // processes them sequentially — all text must be inserted before styles can
  // reference the resulting character indices.
  const insertRequests: docs_v1.Schema$Request[] = [];
  const styleRequests: docs_v1.Schema$Request[] = [];
  const bulletRequests: docs_v1.Schema$Request[] = [];
  const paragraphStyleRequests: docs_v1.Schema$Request[] = [];

  // Google Docs body starts at index 1 (index 0 is the document root)
  let currentIndex = 1;

  for (const item of textWithFormatting) {
    if (!item.text) {
      continue;
    }

    // Track the character range this segment will occupy once inserted
    const startIndex = currentIndex;
    const endIndex = currentIndex + item.text.length;

    // Always insert the raw text first
    insertRequests.push({
      insertText: {
        location: { index: startIndex },
        text: item.text,
      },
    });

    // Apply character-level styles (bold, italic, etc.) to the range we just inserted
    if (item.formatting && Object.keys(item.formatting).length > 0) {
      styleRequests.push({
        updateTextStyle: {
          range: { startIndex, endIndex },
          textStyle: item.formatting,
          fields: fieldMaskFromTextStyle(item.formatting),
        },
      });
    }

    // Apply bullet/numbered list preset — skip whitespace-only segments to avoid
    // creating empty bullet points
    if (item.bulletPreset && item.text.trim().length > 0) {
      bulletRequests.push({
        createParagraphBullets: {
          range: { startIndex, endIndex },
          bulletPreset: item.bulletPreset,
        },
      });
    }

    // Apply heading paragraph style (HEADING_1–HEADING_6)
    if (item.headingLevel) {
      paragraphStyleRequests.push({
        updateParagraphStyle: {
          range: { startIndex, endIndex },
          paragraphStyle: {
            namedStyleType: getNamedStyleType(item.headingLevel),
          },
          fields: "namedStyleType",
        },
      });
    }

    currentIndex = endIndex;
  }

  // Order matters: inserts → styles → paragraph styles → bullets.
  // Inserts must come first so character indices exist when later requests reference them.
  return [...insertRequests, ...styleRequests, ...paragraphStyleRequests, ...bulletRequests];
}

/**
 * Converts a Markdown string into Google Docs API batch requests.
 *
 * Two-step pipeline: Markdown → HTML (via `marked`) → Docs requests (via `parseHtmlToDocRequests`).
 * Falls back to plain-text insertion if `marked` throws.
 */
export function markdownToDocRequests(markdown: string): docs_v1.Schema$Request[] {
  try {
    // async: false guarantees a synchronous string return from marked.parse()
    const html = marked.parse(markdown, { async: false }) as string;
    return parseHtmlToDocRequests(html);
  } catch {
    return plainTextToDocRequests(markdown);
  }
}

/**
 * Resolves which content format to use, with backwards-compatible `usesHtml` fallback.
 * Priority: explicit `contentFormat` > legacy `usesHtml: true` → "html" > default "plain".
 */
export function resolveContentFormat(args: {
  contentFormat?: GoogleDocContentFormat;
  usesHtml?: boolean;
}): GoogleDocContentFormat {
  if (args.contentFormat) {
    return args.contentFormat;
  }
  if (args.usesHtml) {
    return "html";
  }
  return "plain";
}

/**
 * Dispatches content to the appropriate converter based on format.
 * Single entry point so callers don't need to branch on format themselves.
 */
export function contentToDocRequests(args: {
  content: string;
  format: GoogleDocContentFormat;
}): docs_v1.Schema$Request[] {
  const { content, format } = args;
  if (format === "html") {
    return parseHtmlToDocRequests(content);
  } else if (format === "markdown") {
    return markdownToDocRequests(content);
  }
  return plainTextToDocRequests(content);
}
