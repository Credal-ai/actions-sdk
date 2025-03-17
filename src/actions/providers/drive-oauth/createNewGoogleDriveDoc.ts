import {
  AuthParamsType,
  driveOauthCreateNewGoogleDriveDocFunction,
  driveOauthCreateNewGoogleDriveDocOutputType,
  driveOauthCreateNewGoogleDriveDocParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

/**
 * Creates a new Google Doc using OAuth authentication
 * Uses the scope: https://www.googleapis.com/auth/drive.file
 */
const createNewGoogleDriveDoc: driveOauthCreateNewGoogleDriveDocFunction = async ({
  params,
  authParams,
}: {
  params: driveOauthCreateNewGoogleDriveDocParamsType;
  authParams: AuthParamsType;
}): Promise<driveOauthCreateNewGoogleDriveDocOutputType> => {
  if (!authParams.authToken) {
    throw new Error("authToken is required for Google Drive API");
  }

  const { title, content } = params;
  const baseApiUrl = "https://www.googleapis.com/drive/v3/files";
  const mimeType = "application/vnd.google-apps.document";
  const editUrlPattern = "https://docs.google.com/document/d/{fileId}/edit";

  // Create the file with the provided title
  const response = await axiosClient.post(
    baseApiUrl,
    {
      name: title,
      mimeType: mimeType,
    },
    {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        "Content-Type": "application/json",
      },
      params: {
        fields: "id,webViewLink",
      },
    },
  );

  const fileId = response.data.id;

  if (content) {
    // Use the Docs API to insert content
    const docsApiUrl = `https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`;

    await axiosClient.post(
      docsApiUrl,
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

  const fileUrl = editUrlPattern.replace("{fileId}", fileId);

  return {
    fileId,
    fileUrl,
  };
};

export default createNewGoogleDriveDoc;
