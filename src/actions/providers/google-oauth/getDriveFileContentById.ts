import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthGetDriveFileContentByIdFunction,
  googleOauthGetDriveFileContentByIdOutputType,
  googleOauthGetDriveFileContentByIdParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import extractContentFromDriveFileId from "./utils/extractContentFromDriveFileId.js";

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
    // First, get file metadata to determine the file type
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType,size`;
    const metadataRes = await axiosClient.get(metadataUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const { name: fileName, mimeType, size } = metadataRes.data;

    // Check if file is too large (50MB limit for safety)
    const maxFileSize = 50 * 1024 * 1024;
    if (size && parseInt(size) > maxFileSize) {
      return {
        success: false,
        error: "File too large (>50MB)",
      };
    }

    const data = await extractContentFromDriveFileId({ params: { fileId, mimeType }, authParams });
    if (data.error || !data.content) {
      return {
        success: false,
        error: data.error,
      };
    }

    let content = data.content;
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
