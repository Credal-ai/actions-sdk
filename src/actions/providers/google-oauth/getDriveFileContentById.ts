import { axiosClient } from "../../util/axiosClient.js";
import mammoth from "mammoth";
import type {
  AuthParamsType,
  googleOauthGetDriveFileContentByIdFunction,
  googleOauthGetDriveFileContentByIdOutputType,
  googleOauthGetDriveFileContentByIdParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { extractTextFromPdf } from "../../../utils/pdf.js";

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

  const { fileId, limit } = params;

  try {
    // First, get file metadata to determine the file type and if it's in a shared drive
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType,size,driveId,parents&supportsAllDrives=true`;
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

    // Create shared drive parameters if the file is in a shared drive
    const sharedDriveParams = driveId ? "&supportsAllDrives=true" : "";

    // Handle different file types - read content directly
    if (mimeType === "application/vnd.google-apps.document") {
      // Google Docs - download as plain text
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      content = exportRes.data;
    } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
      // Google Sheets - download as CSV
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/csv${sharedDriveParams}`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      // Clean up excessive commas from empty columns
      content = exportRes.data
        .split("\n")
        .map((line: string) => line.replace(/,+$/, "")) // Remove trailing commas
        .map((line: string) => line.replace(/,{2,}/g, ",")) // Replace multiple commas with single comma
        .join("\n");
    } else if (mimeType === "application/vnd.google-apps.presentation") {
      // Google Slides - download as plain text
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      content = exportRes.data;
    } else if (mimeType === "application/pdf") {
      // PDF files - download and extract text using pdfjs-dist
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media${sharedDriveParams}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
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
      // Extract text from PDF
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      // Word documents (.docx or .doc) - download and extract text using mammoth
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media${sharedDriveParams}`;
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
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media${sharedDriveParams}`;
      const downloadRes = await axiosClient.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      content = downloadRes.data;
    } else if (mimeType?.startsWith("image/")) {
      // Skip images
      return {
        success: false,
        error: "Image files are not supported for text extraction",
      };
    } else {
      // Unsupported file type
      return {
        success: false,
        error: `Unsupported file type: ${mimeType}`,
      };
    }
    content = content.trim();

    const originalLength = content.length;

    // Naive way to truncate content
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
