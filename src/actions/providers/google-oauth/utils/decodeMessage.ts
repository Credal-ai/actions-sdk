import { convert } from "html-to-text";

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[] | undefined;
  internalDate: string;
  payload: {
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size: number };
      parts?: GmailMessagePart[];
    }>;
    headers: { name: string; value: string }[];
  };
}

interface GmailMessagePart {
  mimeType: string;
  body?: {
    data?: string;
    size: number;
  };
  parts?: GmailMessagePart[]; // recursive type for nesting
}

export function getEmailContent(message: GmailMessage): string | null {
  const { mimeType, body, parts } = message.payload;

  if (mimeType === "text/plain" && body?.data) {
    return tryDecode(body.data);
  }

  if (mimeType === "text/html" && body?.data) {
    const htmlRaw = tryDecode(body.data);
    if (htmlRaw) return convert(htmlRaw, { wordwrap: false });
  }

  const { plainText, htmlText } = searchParts(parts);
  return plainText ?? htmlText ?? null;
}

function tryDecode(data?: string): string | null {
  if (!data) return null;
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function searchParts(parts?: GmailMessage["payload"]["parts"]): { plainText: string | null; htmlText: string | null } {
  let plainText: string | null = null;
  let htmlText: string | null = null;
  if (!parts) return { plainText, htmlText };
  for (const part of parts) {
    const { mimeType, body, parts: subParts } = part;

    if (mimeType === "text/plain" && !plainText) {
      plainText = tryDecode(body?.data);
    } else if (mimeType === "text/html" && !htmlText) {
      const htmlRaw = tryDecode(body?.data);
      if (htmlRaw) {
        htmlText = convert(htmlRaw, { wordwrap: false });
      }
    }

    if (subParts?.length) {
      const result = searchParts(subParts);
      if (!plainText && result.plainText) plainText = result.plainText;
      if (!htmlText && result.htmlText) htmlText = result.htmlText;
    }
  }
  return { plainText, htmlText };
}
