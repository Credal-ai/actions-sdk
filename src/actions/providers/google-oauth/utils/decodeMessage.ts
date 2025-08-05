import { convert } from "html-to-text";

interface GmailMessage {
  payload: {
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size: number };
      parts?: GmailMessagePart[];
    }>;
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
  let plainText: string | null = null;
  let htmlText: string | null = null;

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

  function searchParts(parts?: GmailMessage["payload"]["parts"]) {
    if (!parts) return;
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
        searchParts(subParts);
      }
    }
  }

  const { mimeType, body, parts } = message.payload;

  if (mimeType === "text/plain" && body?.data) {
    return tryDecode(body.data);
  }

  if (mimeType === "text/html" && body?.data) {
    const htmlRaw = tryDecode(body.data);
    if (htmlRaw) return convert(htmlRaw, { wordwrap: false });
  }

  searchParts(parts);
  return plainText ?? htmlText ?? null;
}