export interface GmailMessage {
  payload: {
    mimeType: string;
    body?: {
      data?: string;
      size: number;
    };
    parts?: Array<{
      partId: string;
      mimeType: string;
      body: {
        data?: string;
        size: number;
      };
      parts?: Array<{
        partId: string;
        mimeType: string;
        body: {
          data?: string;
          size: number;
        };
      }>;
    }>;
  };
}

export function decodeGmailBase64(base64String: string): string {
  // Gmail API uses URL-safe base64 encoding
  const standardBase64 = base64String.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padded = standardBase64.padEnd(standardBase64.length + ((4 - (standardBase64.length % 4)) % 4), "=");

  // Only works for Node.js environment
  return Buffer.from(padded, "base64").toString("utf-8");
}

export function getEmailContent(message: GmailMessage): string | null {
  let textContent: string | null = null;

  // Function to recursively search for plain text content in parts
  function searchParts(parts: GmailMessage["payload"]["parts"]): void {
    if (!parts) return;
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data && !textContent) {
        textContent = decodeGmailBase64(part.body.data);
      } else if (part.parts) {
        // Recursively search nested parts
        searchParts(part.parts);
      }
    }
  }

  // 1. Check if content is directly in the payload body (simple emails)
  if (message.payload.body?.data && message.payload.mimeType === "text/plain") {
    return decodeGmailBase64(message.payload.body.data);
  }

  // 2. Search through parts for plain text content
  if (message.payload.parts) {
    searchParts(message.payload.parts);
  }

  // 3. Return plain text content or null
  return textContent;
}
