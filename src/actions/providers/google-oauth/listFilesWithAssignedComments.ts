import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthListFilesWithAssignedCommentsFunction,
  googleOauthListFilesWithAssignedCommentsParamsType,
  googleOauthListFilesWithAssignedCommentsOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { dedupeByIdKeepFirst, filterReadableFiles } from "./utils.js";

const ASSIGNED_COMMENTS_QUERY = "followup='assignedcomments' and trashed=false";

const listFilesWithAssignedComments: googleOauthListFilesWithAssignedCommentsFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthListFilesWithAssignedCommentsParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthListFilesWithAssignedCommentsOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { limit } = params;

  try {
    const allDrivesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      ASSIGNED_COMMENTS_QUERY,
    )}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=100`;

    const orgWideUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      ASSIGNED_COMMENTS_QUERY,
    )}&fields=files(id,name,mimeType,webViewLink)&corpora=domain&pageSize=100`;

    const [allDrivesRes, orgWideRes] = await Promise.all([
      axiosClient.get(allDrivesUrl, { headers: { Authorization: `Bearer ${authParams.authToken}` } }),
      axiosClient.get(orgWideUrl, { headers: { Authorization: `Bearer ${authParams.authToken}` } }),
    ]);

    const rawFiles = [allDrivesRes.data.files, orgWideRes.data.files]
      .filter(Boolean)
      .flatMap(files => filterReadableFiles(files));

    const files = rawFiles.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      url: file.webViewLink || "",
    }));

    const dedupedFiles = dedupeByIdKeepFirst(files);

    return {
      success: true,
      files: limit ? dedupedFiles.slice(0, limit) : dedupedFiles,
    };
  } catch (error) {
    console.error("Error listing files with assigned comments", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      files: [],
    };
  }
};

export default listFilesWithAssignedComments;
