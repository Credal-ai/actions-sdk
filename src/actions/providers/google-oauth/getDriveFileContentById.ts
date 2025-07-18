import { createAxiosClientWithTimeout, isAxiosTimeoutError } from "../../util/axiosClient.js";
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
  parseGoogleDocFromRawContentToPlainText,
  parseGoogleSheetsFromRawContentToPlainText,
  parseGoogleSlidesFromRawContentToPlainText,
} from "../../../utils/google.js";

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
  const { fileId, limit } = params;
  const axiosClient = createAxiosClientWithTimeout(20000);

  try {
    // First, get file metadata to determine the file type and if it's in a shared drive
    const metadataUrl = `${BASE_URL}${encodeURIComponent(fileId)}?fields=name,mimeType,size,driveId,parents&supportsAllDrives=true`;
    const metadataRes = await axiosClient.get(metadataUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const { name: fileName, mimeType, size, driveId } = metadataRes.data;

    // Check if file is too large (50MB limit for safety)
    const maxFileSize = 50 * 1024 * 1024;
    if (size && parseInt(size) > maxFileSize) {
      return {
        success: false,
        error: "File too large (>50MB)",
      };
    }

    let content: string = "";
    const sharedDriveParams = driveId ? "&supportsAllDrives=true" : "";

    // Google Docs - use Google Docs API instead of Drive export
    if (mimeType === "application/vnd.google-apps.document") {
      try {
        const docsUrl = `https://docs.googleapis.com/v1/documents/${fileId}`;
        const docsRes = await axiosClient.get(docsUrl, {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
          },
        });
        content = parseGoogleDocFromRawContentToPlainText(docsRes.data);
      } catch (docsError) {
        if (isAxiosTimeoutError(docsError)) {
          console.log("Request timed out using Google Docs API - dont retry");
        } else {
          console.log("Error using Google Docs API", docsError);
          // Fallback to Drive API export if Docs API fails
          const exportUrl = `${BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
          const exportRes = await axiosClient.get(exportUrl, {
            headers: {
              Authorization: `Bearer ${authParams.authToken}`,
            },
            responseType: "text",
          });
          content = exportRes.data;
        }
      }
    }
    // Google Sheets - use Google Sheets API instead of Drive export
    else if (mimeType === "application/vnd.google-apps.spreadsheet") {
      try {
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=true`;
        const sheetsRes = await axiosClient.get(sheetsUrl, {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
          },
        });
        content = parseGoogleSheetsFromRawContentToPlainText(sheetsRes.data);
      } catch (sheetsError) {
        if (isAxiosTimeoutError(sheetsError)) {
          console.log("Request timed out using Google Sheets API - dont retry");
        } else {
          console.log("Error fetching file", sheetsError);
          const exportUrl = `${BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/csv${sharedDriveParams}`;
          const exportRes = await axiosClient.get(exportUrl, {
            headers: { Authorization: `Bearer ${authParams.authToken}` },
            responseType: "text",
          });
          content = exportRes.data
            .split("\n")
            .map((line: string) => line.replace(/,+$/, ""))
            .map((line: string) => line.replace(/,{2,}/g, ","))
            .join("\n");
        }
      }
    }
    // Google Slides - use Google Slides API instead of Drive export
    else if (mimeType === "application/vnd.google-apps.presentation") {
      try {
        const slidesUrl = `https://slides.googleapis.com/v1/presentations/${fileId}`;
        const slidesRes = await axiosClient.get(slidesUrl, {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
          },
        });
        content = parseGoogleSlidesFromRawContentToPlainText(slidesRes.data);
      } catch (slidesError) {
        if (isAxiosTimeoutError(slidesError)) {
          console.log("Request timed out using Google Slides API - dont retry");
        } else {
          console.log("Error using Google Slides API", slidesError);
          const exportUrl = `${BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
          const exportRes = await axiosClient.get(exportUrl, {
            headers: { Authorization: `Bearer ${authParams.authToken}` },
            responseType: "text",
          });
          content = exportRes.data;
        }
      }
    }
    // PDF files - download and extract text using pdfjs-dist
    else if (mimeType === "application/pdf") {
      const downloadUrl = `${BASE_URL}${encodeURIComponent(fileId)}?alt=media${sharedDriveParams}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers: { Authorization: `Bearer ${authParams.authToken}` },
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
    }
    // Word documents (.docx or .doc) - download and extract text using mammoth
    else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const downloadUrl = `${BASE_URL}${encodeURIComponent(fileId)}?alt=media${sharedDriveParams}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "arraybuffer",
      });

      try {
        // mammoth works with .docx files. It will ignore formatting and return raw text
        const result = await mammoth.extractRawText({ buffer: Buffer.from(downloadRes.data) });
        content = result.value; // raw text
      } catch (wordError) {
        return {
          success: false,
          error: `Failed to parse Word document: ${wordError instanceof Error ? wordError.message : "Unknown Word error"}`,
        };
      }
    } else if (
      mimeType === "text/plain" ||
      mimeType === "text/html" ||
      mimeType === "application/rtf" ||
      mimeType?.startsWith("text/")
    ) {
      // Text-based files
      const downloadUrl = `${BASE_URL}${encodeURIComponent(fileId)}?alt=media${sharedDriveParams}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      content = downloadRes.data;
    } else {
      // Unsupported file type
      return {
        success: false,
        error: `Unsupported file type: ${mimeType}`,
      };
    }

    // cleaning up parameters
    content = content.trim();
    const originalLength = content.length;
    content = content.replace(/\r?\n+/g, " ").replace(/ +/g, " ");
    if (limit && content.length > limit) {
      content = content.substring(0, limit);
    }

    return {
      success: true,
      content,
      fileName,
      fileLength: originalLength,
    };
  } catch (error) {
    console.error("Error getting Google Drive file content", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getDriveFileContentById;
