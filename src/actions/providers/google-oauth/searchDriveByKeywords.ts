import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthSearchDriveByKeywordsFunction,
  googleOauthSearchDriveByKeywordsOutputType,
  googleOauthSearchDriveByKeywordsParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const searchDriveByKeywords: googleOauthSearchDriveByKeywordsFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthSearchDriveByKeywordsParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthSearchDriveByKeywordsOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { keywords } = params;

  // Build the query: fullText contains 'keyword1' or fullText contains 'keyword2' ...
  const query = keywords.map(kw => `fullText contains '${kw.replace(/'/g, "\\'")}'`).join(" or ");

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query,
  )}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

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

    return { success: true, files };
  } catch (error) {
    console.error("Error searching Google Drive", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      files: [],
    };
  }
};

export default searchDriveByKeywords;
