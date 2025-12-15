import type {
  AuthParamsType,
  googleOauthCopyDriveFileFunction,
  googleOauthCopyDriveFileParamsType,
  googleOauthCopyDriveFileOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const BASE_API_URL = "https://www.googleapis.com/drive/v3/files/";

interface DriveFileCopyResponse {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

/**
 * Copies a file in Google Drive. Useful for creating documents from templates.
 * See: https://developers.google.com/workspace/drive/api/reference/rest/v3/files/copy
 */
const copyDriveFile: googleOauthCopyDriveFileFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCopyDriveFileParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCopyDriveFileOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { fileId, name, parentFolderId, description } = params;

  // Request webViewLink in response fields
  const copyFileUrl = `${BASE_API_URL}${encodeURIComponent(fileId)}/copy?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`;

  const requestBody = {
    ...(name && { name }),
    ...(parentFolderId && { parents: [parentFolderId] }),
    ...(description && { description }),
  };

  try {
    const response = await axiosClient.post<DriveFileCopyResponse>(copyFileUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        "Content-Type": "application/json",
      },
    });

    const { id, name: fileName, mimeType, webViewLink } = response.data;

    return {
      success: true,
      fileId: id,
      fileUrl: webViewLink,
      fileName,
      mimeType,
    };
  } catch (error) {
    console.error("Error copying Google Drive file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default copyDriveFile;
