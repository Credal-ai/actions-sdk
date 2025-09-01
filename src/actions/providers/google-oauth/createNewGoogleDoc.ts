import type {
  AuthParamsType,
  googleOauthCreateNewGoogleDocFunction,
  googleOauthCreateNewGoogleDocOutputType,
  googleOauthCreateNewGoogleDocParamsType,
} from "../../autogen/types.js";

// Google Docs API types
interface Location {
  index: number;
}

interface Range {
  startIndex: number;
  endIndex: number;
}

interface Dimension {
  magnitude: number;
  unit: string;
}

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: Dimension;
}

interface InsertTextRequest {
  insertText: {
    location: Location;
    text: string;
  };
}

interface UpdateTextStyleRequest {
  updateTextStyle: {
    range: Range;
    textStyle: TextStyle;
    fields: string;
  };
}

type BatchUpdateRequest = InsertTextRequest | UpdateTextStyleRequest;

interface TextWithFormatting {
  text: string;
  formatting?: TextStyle;
}
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Parses HTML content and converts it to Google Docs API batch update requests
 */
function parseHtmlToDocRequests(htmlContent: string): BatchUpdateRequest[] {
  const requests: BatchUpdateRequest[] = [];
  let currentIndex = 1;

  // Strip HTML tags and extract text with basic formatting
  const textWithFormatting = parseHtmlContent(htmlContent);

  for (const item of textWithFormatting) {
    // Insert text
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: item.text,
      },
    });

    // Apply formatting if present
    if (item.formatting && Object.keys(item.formatting).length > 0) {
      const endIndex = currentIndex + item.text.length;
      requests.push({
        updateTextStyle: {
          range: { startIndex: currentIndex, endIndex },
          textStyle: item.formatting,
          fields: Object.keys(item.formatting).join(","),
        },
      });
    }

    currentIndex += item.text.length;
  }

  return requests;
}

/**
 * Basic HTML parser that extracts text and formatting
 */
function parseHtmlContent(html: string): TextWithFormatting[] {
  const result: TextWithFormatting[] = [];

  // Handle line breaks
  html = html.replace(/<br\s*\/?>/gi, "\n");
  html = html.replace(/<\/p>/gi, "\n");
  html = html.replace(/<p[^>]*>/gi, "");

  // Simple regex-based parsing for basic HTML tags
  const segments = html.split(/(<[^>]+>)/);
  const currentFormatting: TextStyle = {};

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (segment.startsWith("<")) {
      // This is an HTML tag
      if (segment.match(/<\s*b\s*>/i) || segment.match(/<\s*strong\s*>/i)) {
        currentFormatting.bold = true;
      } else if (segment.match(/<\/\s*b\s*>/i) || segment.match(/<\/\s*strong\s*>/i)) {
        delete currentFormatting.bold;
      } else if (segment.match(/<\s*i\s*>/i) || segment.match(/<\s*em\s*>/i)) {
        currentFormatting.italic = true;
      } else if (segment.match(/<\/\s*i\s*>/i) || segment.match(/<\/\s*em\s*>/i)) {
        delete currentFormatting.italic;
      } else if (segment.match(/<\s*u\s*>/i)) {
        currentFormatting.underline = true;
      } else if (segment.match(/<\/\s*u\s*>/i)) {
        delete currentFormatting.underline;
      } else if (segment.match(/<\s*h[1-6]\s*>/i)) {
        const headingLevel = segment.match(/<\s*h([1-6])\s*>/i)?.[1];
        currentFormatting.fontSize = { magnitude: 18 - (parseInt(headingLevel || "1") - 1) * 2, unit: "PT" };
        currentFormatting.bold = true;
      } else if (segment.match(/<\/\s*h[1-6]\s*>/i)) {
        delete currentFormatting.fontSize;
        delete currentFormatting.bold;
      }
    } else if (segment.trim()) {
      // This is text content
      result.push({
        text: segment,
        formatting: Object.keys(currentFormatting).length > 0 ? { ...currentFormatting } : undefined,
      });
    }
  }

  // If no formatted content was found, return the plain text
  if (result.length === 0) {
    const plainText = html.replace(/<[^>]*>/g, "");
    if (plainText.trim()) {
      result.push({ text: plainText });
    }
  }

  return result;
}

/**
 * Creates a new Google Doc document using OAuth authentication
 */
const createNewGoogleDoc: googleOauthCreateNewGoogleDocFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCreateNewGoogleDocParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCreateNewGoogleDocOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const { title, content, usesHtml } = params;
  const baseApiUrl = "https://docs.googleapis.com/v1/documents";

  // Create the document with the provided title
  const response = await axiosClient.post(
    baseApiUrl,
    { title },
    {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  // If content is provided, update the document body with the content
  if (content) {
    const documentId = response.data.documentId;

    if (usesHtml) {
      // Parse HTML content and create requests for rich text formatting
      const requests = parseHtmlToDocRequests(content);

      await axiosClient.post(
        `${baseApiUrl}/${documentId}:batchUpdate`,
        { requests },
        {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    } else {
      // Add plain text content to the document
      await axiosClient.post(
        `${baseApiUrl}/${documentId}:batchUpdate`,
        {
          requests: [
            {
              insertText: {
                location: {
                  index: 1, // Insert at the beginning of the document
                },
                text: content,
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  return {
    documentId: response.data.documentId,
    documentUrl: response.data.documentId
      ? `https://docs.google.com/document/d/${response.data.documentId}/edit`
      : undefined,
  };
};

export default createNewGoogleDoc;
