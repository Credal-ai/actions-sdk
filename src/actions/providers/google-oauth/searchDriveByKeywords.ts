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

  const { keywords, limit } = params;

  // Build the query: fullText contains 'keyword1' or fullText contains 'keyword2' ...
  const query = keywords.map(kw => `fullText contains '${kw.replace(/'/g, "\\'")}'`).join(" or ");

  try {
    const allDrivesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query,
    )}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=1000`;

    const allDrivesRes = axiosClient.get(allDrivesUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    // need to search domain wide separately because the allDrives search doesn't include domain wide files
    const orgWideUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query,
    )}&fields=files(id,name,mimeType,webViewLink)&corpora=domain&pageSize=1000`;

    const orgWideRes = axiosClient.get(orgWideUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const results = await Promise.all([allDrivesRes, orgWideRes]);
    const relevantResults = results
      .map(result => result.data.files)
      .filter(Boolean)
      .map(files => limit ? files.slice(0, limit) : files).flat();

    const files =
      relevantResults.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
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
