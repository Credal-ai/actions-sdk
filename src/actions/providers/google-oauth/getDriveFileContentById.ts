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
import { getGoogleDocContent, getGoogleSheetContent, getGoogleSlidesContent } from "../../../utils/google.js";

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

  const BASE_URL = "https://www.googleapis.com/drive/v3/files/";
  const headers = { Authorization: `Bearer ${authParams.authToken}` };

  const { limit } = params;
  const timeoutLimit =
    params.timeoutLimit !== undefined && params.timeoutLimit > 0 ? params.timeoutLimit * 1000 : 15_000;
  const axiosClient = createAxiosClientWithTimeout(timeoutLimit);

  // helper to fetch drive metadata with fields we need (incl. shortcut details)
  const fetchMeta = async (fid: string) => {
    const metaUrl =
      `${BASE_URL}${encodeURIComponent(fid)}` +
      `?fields=name,mimeType,size,driveId,parents,` +
      `shortcutDetails(targetId,targetMimeType)` +
      `&supportsAllDrives=true`;
    const res = await axiosClient.get(metaUrl, { headers });
    return res.data as {
      name?: string;
      mimeType?: string;
      size?: string;
      driveId?: string;
      parents?: string[];
      shortcutDetails?: { targetId?: string; targetMimeType?: string };
    };
  };

  try {
    // 1) metadata (possibly a shortcut)
    let meta = await fetchMeta(params.fileId);

    // 2) resolve shortcut transparently (re-point to target id + mime)
    if (meta.mimeType === "application/vnd.google-apps.shortcut" && meta.shortcutDetails?.targetId) {
      meta = await fetchMeta(meta.shortcutDetails.targetId);
    }

    const fileName = meta.name ?? "";
    const mimeType = meta.mimeType ?? "";
    const size = meta.size ? parseInt(meta.size, 10) : undefined;
    const driveId = meta.driveId;

    // 3) size gate (same as before)
    const maxMegabytes = params.fileSizeLimit && params.fileSizeLimit > 0 ? params.fileSizeLimit : 50;
    const maxFileSize = maxMegabytes * 1024 * 1024;
    if (size !== undefined && size > maxFileSize) {
      return { success: false, error: `File too large (${maxMegabytes}MB)` };
    }

    let content = "";
    const sharedDriveParam = driveId ? "&supportsAllDrives=true" : "";

    // 4) content by type (same behavior you had)
    if (mimeType === "application/vnd.google-apps.document") {
      content = await getGoogleDocContent(params.fileId, authParams.authToken!, axiosClient, sharedDriveParam);
    } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
      content = await getGoogleSheetContent(params.fileId, authParams.authToken!, axiosClient, sharedDriveParam);
    } else if (mimeType === "application/vnd.google-apps.presentation") {
      content = await getGoogleSlidesContent(params.fileId, authParams.authToken!, axiosClient, sharedDriveParam);
    } else if (mimeType === "application/pdf") {
      const downloadUrl = `${BASE_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
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
      const downloadUrl = `${BASE_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
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
      mimeType === "application/rtf" ||
      mimeType.startsWith("text/")
    ) {
      // Optional optimization: if limit is small, use Range to avoid full download.
      const downloadUrl = `${BASE_URL}${encodeURIComponent(params.fileId)}?alt=media${sharedDriveParam}`;
      const useRange = typeof limit === "number" && limit > 0 && limit <= 1_000_000;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers: useRange ? { ...headers, Range: `bytes=0-${Math.max(0, limit - 1)}` } : headers,
        responseType: "text",
      });
      content = downloadRes.data ?? "";
    } else {
      return { success: false, error: `Unsupported file type: ${mimeType}` };
    }

    // 5) normalize whitespace + apply content limit
    content = (content ?? "").trim().replace(/\r?\n+/g, " ").replace(/ +/g, " ");
    const originalLength = content.length;
    if (limit && content.length > limit) {
      content = content.slice(0, limit);
    }

    return { success: true, content, fileName, fileLength: originalLength };
  } catch (error) {
    console.error("Error getting Google Drive file content", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getDriveFileContentById;