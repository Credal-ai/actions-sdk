import { axiosClient } from "../../../util/axiosClient.js";
import mammoth from "mammoth";
import type { AuthParamsType } from "../../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../../util/missingAuthConstants.js";

export type getDriveFileContentParams = {
  fileId: string;
  mimeType: string;
};

export type getDriveFileContentOutput = {
  success: boolean;
  content?: string;
  error?: string;
};

const extractContentFromDriveFileId = async ({
  params,
  authParams,
}: {
  params: getDriveFileContentParams;
  authParams: AuthParamsType;
}): Promise<getDriveFileContentOutput> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { fileId, mimeType } = params;
  let content = "";

  try {
    // Handle different file types - read content directly
    if (mimeType === "application/vnd.google-apps.document") {
      // Google Docs - download as plain text
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      content = exportRes.data;
    } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
      // Google Sheets - download as CSV
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/csv`;
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
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        responseType: "text",
      });
      content = exportRes.data;
    } else if (mimeType === "application/pdf") {
      return {
        success: false,
        error: "PDF files are not supported for text extraction",
      };
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      // Word documents (.docx or .doc) - download and extract text using mammoth
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
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
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
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

    return {
      success: true,
      content,
    };
  } catch (error) {
    console.error("Error getting Google Drive file content", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default extractContentFromDriveFileId;
