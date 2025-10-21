import type { KnownBlock } from "@slack/web-api";
import type { RichTextBlockElement, RichTextElement } from "@slack/types";
import type { Attachment } from "@slack/web-api/dist/types/response/ChannelsHistoryResponse.js";
import type { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse.js";

export interface SlackMessage {
  ts?: string;
  text?: string;
  user?: string;
  username?: string;
  thread_ts?: string;
  blocks?: KnownBlock[];
  attachments?: Attachment[];
  reactions?: Array<{ name: string; count: number; users: string[] }>;
  files?: Array<{ name?: string; title?: string; mimetype?: string; url_private?: string }>;
}

export type SimplifiedFile = {
  id: string;
  created?: number;
  timestamp?: number;
  name?: string;
  title?: string;
  mimetype?: string;
  file_access?: string;
  highest_thumb?: string;
};

/**
 * Get the highest quality thumbnail from a file
 */
export function getHighestQualityThumb(file: Record<string, unknown>): string | undefined {
  const thumbSizes = [
    "thumb_1024",
    "thumb_960",
    "thumb_800",
    "thumb_720",
    "thumb_480",
    "thumb_360",
    "thumb_160",
    "thumb_80",
    "thumb_64",
  ];

  for (const size of thumbSizes) {
    const thumb = file[size];
    if (thumb && typeof thumb === "string") {
      return thumb;
    }
  }

  return undefined;
}

/**
 * Simplify file objects to only include essential fields and highest quality thumbnail
 */
export function simplifyFile(file: Record<string, unknown>): SimplifiedFile {
  const simplified: SimplifiedFile = {
    id: file.id as string,
    created: file.created as number | undefined,
    timestamp: file.timestamp as number | undefined,
    name: file.name as string | undefined,
    title: file.title as string | undefined,
    mimetype: file.mimetype as string | undefined,
    file_access: file.file_access as string | undefined,
  };

  const highestThumb = getHighestQualityThumb(file);
  if (highestThumb) {
    simplified.highest_thumb = highestThumb;
  }

  return simplified;
}

// Redundant fields to remove from messages - not useful (fills up context window so we can ditch these)
const REDUNDANT_FIELDS = [
  // Image/media metadata
  "app_icons",
  "image_width",
  "image_height",
  "image_bytes",
  "fallback",
  "is_animated",

  // Message metadata (not content-related)
  "team",
  "client_msg_id",
  "is_locked",
  "subscribed",
  "display_as_bot",
  "upload",

  // Block metadata
  "block_id",
  "unicode", // Emoji unicode values (name is sufficient)

  // File metadata (duplicates or not useful)
  "file_access",
  "filetype", // Redundant with mimetype
  "pretty_type", // Redundant with mimetype
  "thumb_tiny", // Base64 preview, not needed

  // Attachment metadata
  "service_icon", // Icon URLs for link previews
  "from_url", // Duplicate of original_url
];

/**
 * Recursively remove redundant fields from an object to reduce payload size
 */
export function removeRedundantFields(obj: Record<string, unknown>): void {
  for (const key of REDUNDANT_FIELDS) {
    delete obj[key];
  }

  // Recursively clean nested objects and arrays
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === "object") {
            removeRedundantFields(item as Record<string, unknown>);
          }
        });
      } else {
        removeRedundantFields(value as Record<string, unknown>);
      }
    }
  }
}

/**
 * Extracts all visible text from a Slack message
 */
export function extractMessageText(m: SlackMessage | undefined): string | undefined {
  if (!m) return undefined;
  const pieces: string[] = [];

  // ---- Rich text helpers ----
  const walkRichTextInline = (el: RichTextElement) => {
    const blockPieces: string[] = [];
    switch (el.type) {
      case "text":
        blockPieces.push(el.text);
        break;
      case "link":
        blockPieces.push(el.text || el.url);
        break;
      case "user":
        blockPieces.push(`<@${el.user_id}>`);
        break;
      case "channel":
        blockPieces.push(`<#${el.channel_id}>`);
        break;
      case "emoji":
        blockPieces.push(`:${el.name}:`);
        break;
      case "broadcast":
        blockPieces.push(`@${el.range}`);
        break;
      case "date":
        blockPieces.push(el.fallback ?? `<date:${el.timestamp}>`);
        break;
      case "team":
        blockPieces.push(`<team:${el.team_id}>`);
        break;
      case "usergroup":
        blockPieces.push(`<usergroup:${el.usergroup_id}>`);
        break;
      case "color":
        // Usually formatting only, skip
        break;
    }
    return blockPieces;
  };

  const walkRichTextElement = (el: RichTextBlockElement) => {
    const result: string[] = [];
    switch (el.type) {
      case "rich_text_section":
      case "rich_text_quote":
        result.push(el.elements.map(walkRichTextInline).join("\n"));
        break;
      case "rich_text_list":
        result.push(el.elements.map(section => section.elements.map(walkRichTextInline).join("\n")).join("\n"));
        break;
      case "rich_text_preformatted":
        result.push(el.elements.map(walkRichTextInline).join("\n"));
        break;
    }
    return result;
  };

  // ---- Block helpers ----
  const walkBlock = (block: KnownBlock) => {
    const blockPieces: string[] = [];
    switch (block.type) {
      case "section":
        if (block.text?.text) blockPieces.push(block.text.text);
        if (block.fields) {
          for (const f of block.fields) if (f.text) blockPieces.push(f.text);
        }
        if (block.accessory && "text" in block.accessory && block.accessory.text) {
          blockPieces.push(block.accessory.text.text);
        }
        break;

      case "context":
        if (Array.isArray(block.elements)) {
          block.elements.forEach(el => {
            if ("text" in el && el.text) blockPieces.push(el.text);
          });
        }
        break;

      case "header":
        if (block.text?.text) blockPieces.push(block.text.text);
        break;

      case "rich_text":
        blockPieces.push(block.elements.map(walkRichTextElement).join("\n"));
        break;

      case "markdown":
        if (block.text) blockPieces.push(block.text);
        break;

      case "video":
        if (block.title?.text) blockPieces.push(block.title.text);
        if (block.description?.text) blockPieces.push(block.description.text);
        break;

      case "image":
        if (block.title?.text) blockPieces.push(block.title.text);
        break;

      case "input":
        if (block.label?.text) blockPieces.push(block.label.text);
        if (block.hint?.text) blockPieces.push(block.hint.text);
        break;

      // divider, file, actions, input don't contribute visible text
      case "divider":
      case "file":
      case "actions":
        break;
    }
    return blockPieces;
  };

  let blockText = "";

  if (Array.isArray(m.blocks)) {
    const blockPieces = m.blocks.map(b => walkBlock(b));
    blockText = blockPieces.join("\n");
  }

  if (blockText) {
    pieces.push(blockText);
  } else if (m.text) {
    pieces.push(m.text);
  }

  // 3. Attachments
  if (m.attachments) {
    for (const att of m.attachments) {
      if (att.pretext) pieces.push(att.pretext);
      if (att.title) pieces.push(att.title);
      if (att.text) pieces.push(att.text);
      if (att.fields) {
        for (const f of att.fields) {
          const title = f.title?.trim() ?? "";
          const value = f.value?.trim() ?? "";
          if (title || value) {
            pieces.push(title && value ? `${title}: ${value}` : title || value);
          }
        }
      }
    }
  }

  // Deduplicate and join
  const out = Array.from(new Set(pieces.map(s => s.trim()).filter(Boolean))).join("\n");

  return out || undefined;
}

/**
 * Transforms a Slack MessageElement to a simplified SlackMessage
 */
export function transformToSlackMessage(message: MessageElement): SlackMessage {
  return {
    ts: message.ts,
    text: message.text,
    user: message.user,
    username: message.username,
    thread_ts: message.thread_ts,
    blocks: message.blocks as unknown as KnownBlock[],
    attachments: message.attachments,
    reactions: message.reactions as Array<{ name: string; count: number; users: string[] }> | undefined,
    files: message.files as
      | Array<{ name?: string; title?: string; mimetype?: string; url_private?: string }>
      | undefined,
  };
}
