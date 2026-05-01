import { createAxiosClientWithTimeout } from "../../util/axiosClient.js";
import mammoth from "mammoth";
import type {
  AuthParamsType,
  googleOauthGetDriveFileContentByIdFunction,
  googleOauthGetDriveFileContentByIdOutputType,
  googleOauthGetDriveFileContentByIdParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { extractTextFromPdf } from "../../../utils/pdf.js";
import {
  getGoogleDocContent,
  getGoogleSheetContent,
  getGoogleSlidesContent,
  parseWorkbookBufferToPlainText,
} from "../../../utils/google.js";
import type { DriveFileMetadata } from "./common.js";
import officeParser from "officeparser";
import { log } from "../../../utils/logger.js";

const BASE_WEB_URL = "https://drive.google.com/file/d/";
const BASE_API_URL = "https://www.googleapis.com/drive/v3/files/";

const NEWLINE_REGEX = /\r?\n+/g;
const WHITESPACE_REGEX = / +/g;

const getDriveFileContentById: googleOauthGetDriveFileContentByIdFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthGetDriveFileContentByIdParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthGetDriveFileContentByIdOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  const { limit: charLimit, fileId } = params;
  const timeoutLimit =
    params.timeoutLimit !== undefined && params.timeoutLimit > 0 ? params.timeoutLimit * 1000 : 15_000;
  const axiosClient = createAxiosClientWithTimeout(timeoutLimit);

  // helper to fetch drive metadata with fields we need (incl. shortcut details)
  const fetchMeta = async (fid: string) => {
    const metaUrl =
      `${BASE_API_URL}${encodeURIComponent(fid)}` +
      `?fields=name,mimeType,size,driveId,parents,` +
      `shortcutDetails(targetId,targetMimeType)` +
      `&supportsAllDrives=true`;
    const res = await axiosClient.get<DriveFileMetadata>(metaUrl, {
      headers,
      timeout: timeoutLimit,
    });
    return res.data;
  };

  try {
    // 1) metadata (possibly a shortcut)
    let meta = await fetchMeta(fileId);

    // 2) resolve shortcut transparently (re-point to target id + mime)
    if (meta.mimeType === "application/vnd.google-apps.shortcut" && meta.shortcutDetails?.targetId) {
      meta = await fetchMeta(meta.shortcutDetails.targetId);
    }

    const fileName = meta.name ?? "";
    const mimeType = meta.mimeType ?? "";
    const size = meta.size ? parseInt(meta.size, 10) : undefined;
    const driveId = meta.driveId;

    // Check if file is too large (50MB limit for safety)
    const maxMegabytes = params.fileSizeLimit && params.fileSizeLimit > 0 ? params.fileSizeLimit : 50;
    const maxFileSize = maxMegabytes * 1024 * 1024;
    if (size !== undefined && size > maxFileSize) {
      return { success: false, error: `File too large (${maxMegabytes}MB)` };
    }

    let content = "";
    const sharedDriveParam = driveId ? "&supportsAllDrives=true" : "";

    // Google Docs - use Google Docs API instead of Drive export
    if (mimeType === "application/vnd.google-apps.document") {
      content = await getGoogleDocContent(params.fileId, authParams.authToken!, axiosClient, sharedDriveParam);
    } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
      content = await getGoogleSheetContent(params.fileId, authParams.authToken!, axiosClient, sharedDriveParam);
    } else if (mimeType === "application/vnd.google-apps.presentation") {
      content = await getGoogleSlidesContent(params.fileId, authParams.authToken!, axiosClient, sharedDriveParam);
    } else if (mimeType === "application/pdf") {
      const downloadUrl = `${BASE_API_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers,
        responseType: "arraybuffer",
      });
      try {
        content = await extractTextFromPdf(downloadRes.data);
      } catch (e) {
        return {
          success: false,
          error: `Failed to parse PDF document: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
        };
      }
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const downloadUrl = `${BASE_API_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers,
        responseType: "arraybuffer",
      });
      try {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(downloadRes.data) });
        content = result.value ?? "";
      } catch (wordError) {
        return {
          success: false,
          error: `Failed to parse Word document: ${
            wordError instanceof Error ? wordError.message : "Unknown Word error"
          }`,
        };
      }
    } else if (
      mimeType === "text/plain" ||
      mimeType === "text/html" ||
      mimeType === "text/csv" ||
      mimeType === "text/tab-separated-values" ||
      mimeType === "application/rtf" ||
      mimeType === "application/json"
    ) {
      const downloadUrl = `${BASE_API_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers,
        responseType: "text",
      });
      content = downloadRes.data;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      const downloadUrl = `${BASE_API_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers,
        responseType: "arraybuffer",
      });
      content = parseWorkbookBufferToPlainText(downloadRes.data, charLimit);
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      // Handle modern PowerPoint files (.pptx only)
      const downloadUrl = `${BASE_API_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers,
        responseType: "arraybuffer",
      });
      try {
        // officeparser expects a Buffer, so convert the ArrayBuffer
        const buffer = Buffer.from(downloadRes.data);
        content = await officeParser.parseOfficeAsync(buffer);
      } catch (powerpointError) {
        return {
          success: false,
          error: `Failed to parse PowerPoint document: ${
            powerpointError instanceof Error ? powerpointError.message : "Unknown PowerPoint error"
          }`,
        };
      }
    } else {
      return { success: false, error: `Unsupported file type: ${mimeType}` };
    }

    // 5) Apply content limit early, then normalize whitespace
    const originalLength = content.length;
    content = content.trim().replace(NEWLINE_REGEX, " ").replace(WHITESPACE_REGEX, " ");

    if (charLimit && content.length > charLimit) {
      content = content.slice(0, charLimit);
    }

    return {
      success: true,
      results: [
        {
          name: fileName,
          url: `${BASE_WEB_URL}${params.fileId}`,
          contents: { content, fileName, fileLength: originalLength },
        },
      ],
    };
  } catch (error) {
    log.error("Error getting Google Drive file content", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getDriveFileContentById;
