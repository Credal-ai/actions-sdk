import mammoth from "mammoth";
import officeParser from "officeparser";
import type {
  AuthParamsType,
  microsoftReadSharepointContentFunction,
  microsoftReadSharepointContentOutputType,
  microsoftReadSharepointContentParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";
import { extractTextFromPdf } from "../../../utils/pdf.js";
import { parseWorkbookBufferToPlainText } from "../../../utils/google.js";
import { MICROSOFT_GRAPH_API_URL } from "./utils.js";
import type { ResolvedSharepointItem, SharepointDriveItem } from "./sharepointUtils.js";
import { MISSING_SITES_SCOPE_MESSAGE, resolveItemFromUrl } from "./sharepointUtils.js";

const DEFAULT_FILE_SIZE_LIMIT_MB = 50;

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/html",
  "text/csv",
  "text/tab-separated-values",
  "application/rtf",
  "application/json",
]);

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function buildResult(
  name: string,
  url: string,
  content: string,
  charLimit?: number,
): microsoftReadSharepointContentOutputType {
  const originalLength = content.length;
  let finalContent = content.trim();
  if (charLimit && charLimit > 0 && finalContent.length > charLimit) {
    finalContent = `${finalContent.slice(0, charLimit)}\n\n[Content truncated to ${charLimit} characters]`;
  }
  return {
    success: true,
    results: [{ name, url, contents: { content: finalContent, fileName: name, fileLength: originalLength } }],
  };
}

async function convertFileBuffer(mimeType: string, buffer: Buffer, charLimit?: number): Promise<string> {
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }
  if (mimeType === "application/pdf") {
    return await extractTextFromPdf(buffer);
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return parseWorkbookBufferToPlainText(buffer, charLimit);
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    return await officeParser.parseOfficeAsync(buffer);
  }
  if (TEXT_MIME_TYPES.has(mimeType) || mimeType.startsWith("text/")) {
    return buffer.toString("utf-8");
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function readFileContent(
  file: { driveId: string; itemId: string; name?: string; webUrl?: string; mimeType?: string; sizeBytes?: number },
  headers: Record<string, string>,
  charLimit?: number,
  fileSizeLimit?: number,
): Promise<microsoftReadSharepointContentOutputType> {
  const maxMegabytes = fileSizeLimit && fileSizeLimit > 0 ? fileSizeLimit : DEFAULT_FILE_SIZE_LIMIT_MB;
  const maxFileSize = maxMegabytes * 1024 * 1024;
  if (file.sizeBytes !== undefined && file.sizeBytes > maxFileSize) {
    const actualMegabytes = (file.sizeBytes / (1024 * 1024)).toFixed(1);
    return { success: false, error: `File too large: ${actualMegabytes}MB exceeds the ${maxMegabytes}MB limit` };
  }

  const downloadResponse = await axiosClient.get(
    `${MICROSOFT_GRAPH_API_URL}/drives/${file.driveId}/items/${file.itemId}/content`,
    { headers, responseType: "arraybuffer" },
  );
  const buffer = Buffer.from(downloadResponse.data);
  const content = await convertFileBuffer(file.mimeType ?? "", buffer, charLimit);
  return buildResult(file.name ?? "", file.webUrl ?? "", content, charLimit);
}

async function readPageContent(
  page: { siteId: string; pageId?: string; name?: string; webUrl?: string },
  headers: Record<string, string>,
  charLimit?: number,
): Promise<microsoftReadSharepointContentOutputType> {
  if (!page.pageId) {
    return { success: false, error: "Could not identify the site page from the URL" };
  }
  try {
    const response = await axiosClient.get(
      `${MICROSOFT_GRAPH_API_URL}/sites/${page.siteId}/pages/${page.pageId}/microsoft.graph.sitePage/webparts`,
      { headers },
    );
    const webparts: { innerHtml?: string }[] = response.data.value ?? [];
    const content = webparts
      .map(webpart => (webpart.innerHtml ? stripHtml(webpart.innerHtml) : ""))
      .filter(Boolean)
      .join("\n\n");
    return buildResult(page.name ?? "", page.webUrl ?? "", content, charLimit);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return { success: false, error: MISSING_SITES_SCOPE_MESSAGE };
    }
    throw error;
  }
}

/**
 * Resolve the target document from either a driveItem reference or a URL. The driveItem
 * takes precedence over url when both are provided (it is an exact round-trip token; a
 * url would be re-resolved and could name a different item).
 */
async function resolveTargetItem(
  authToken: string,
  params: { url?: string; driveItem?: { driveId: string; itemId: string } },
  headers: Record<string, string>,
): Promise<ResolvedSharepointItem> {
  const { url, driveItem } = params;
  if (driveItem) {
    const { driveId, itemId } = driveItem;
    const metadataResponse = await axiosClient.get(`${MICROSOFT_GRAPH_API_URL}/drives/${driveId}/items/${itemId}`, {
      headers,
    });
    const item: SharepointDriveItem = metadataResponse.data;
    return {
      itemType: item.folder ? "folder" : "file",
      driveId,
      itemId,
      name: item.name,
      webUrl: item.webUrl,
      mimeType: item.file?.mimeType,
      sizeBytes: item.size,
    };
  }
  return resolveItemFromUrl(authToken, url!);
}

const readSharepointContent: microsoftReadSharepointContentFunction = async ({
  params,
  authParams,
}: {
  params: microsoftReadSharepointContentParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftReadSharepointContentOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { url, driveItem, charLimit, fileSizeLimit } = params;
  if (charLimit != null && (!Number.isFinite(charLimit) || charLimit <= 0)) {
    return { success: false, error: "charLimit must be a positive number" };
  }
  if (fileSizeLimit != null && (!Number.isFinite(fileSizeLimit) || fileSizeLimit <= 0)) {
    return { success: false, error: "fileSizeLimit must be a positive number" };
  }
  if (!url && !driveItem) {
    return { success: false, error: "Either url or driveItem must be provided" };
  }

  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  try {
    const resolved = await resolveTargetItem(authParams.authToken, { url, driveItem }, headers);

    if (resolved.itemType === "folder" || resolved.itemType === "site") {
      return {
        success: false,
        error: `The URL points to a ${resolved.itemType}, not a document. Use listSharepointFolder to enumerate it and read files individually.`,
      };
    }
    if (resolved.itemType === "page") {
      return await readPageContent(resolved, headers, charLimit);
    }
    return await readFileContent(resolved, headers, charLimit, fileSizeLimit);
  } catch (error) {
    console.error("Error reading SharePoint content", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default readSharepointContent;
