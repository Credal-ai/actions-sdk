import {
  AuthParamsType,
  driveOauthCreateNewGoogleDriveSheetFunction,
  driveOauthCreateNewGoogleDriveSheetOutputType,
  driveOauthCreateNewGoogleDriveSheetParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

/**
 * Creates a new Google Sheet using OAuth authentication
 * Uses the scope: https://www.googleapis.com/auth/drive.file
 */
const createNewGoogleDriveSheet: driveOauthCreateNewGoogleDriveSheetFunction = async ({
  params,
  authParams,
}: {
  params: driveOauthCreateNewGoogleDriveSheetParamsType;
  authParams: AuthParamsType;
}): Promise<driveOauthCreateNewGoogleDriveSheetOutputType> => {
  if (!authParams.authToken) {
    throw new Error("authToken is required for Google Drive API");
  }

  const { title, content } = params;
  const baseApiUrl = "https://www.googleapis.com/drive/v3/files";
  const mimeType = "application/vnd.google-apps.spreadsheet";
  const editUrlPattern = "https://docs.google.com/spreadsheets/d/{fileId}/edit";

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
    // Use the Sheets API to insert content
    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}:batchUpdate`;

    // Parse the content: split by newlines for rows and commas/tabs for columns
    const rows = content.split("\n");
    const values = rows.map(row => row.split(/[,\t]/));

    await axiosClient.post(
      sheetsApiUrl,
      {
        requests: [
          {
            updateCells: {
              start: {
                sheetId: 0,
                rowIndex: 0,
                columnIndex: 0,
              },
              rows: values.map(row => ({
                values: row.map(cell => ({
                  userEnteredValue: {
                    stringValue: cell.trim(),
                  },
                })),
              })),
              fields: "userEnteredValue",
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

export default createNewGoogleDriveSheet;
