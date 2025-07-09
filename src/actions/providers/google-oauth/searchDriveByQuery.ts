import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthSearchDriveByQueryFunction,
  googleOauthSearchDriveByQueryParamsType,
  googleOauthSearchDriveByQueryOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const searchDriveByQuery: googleOauthSearchDriveByQueryFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthSearchDriveByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthSearchDriveByQueryOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { query, limit } = params;

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query,
  )}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`;

  try {
    const res = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const files =
      res.data.files?.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
        id: file.id || "",
        name: file.name || "",
        mimeType: file.mimeType || "",
        url: file.webViewLink || "",
      })) || [];

    return { success: true, files: limit ? files.splice(0, limit) : files };
  } catch (error) {
    console.error("Error searching Google Drive", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      files: [],
    };
  }
};

export default searchDriveByQuery;
