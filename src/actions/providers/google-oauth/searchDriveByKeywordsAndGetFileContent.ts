// axiosClient not needed in this wrapper
import type {
  AuthParamsType,
  googleOauthSearchDriveByKeywordsAndGetFileContentFunction,
  googleOauthSearchDriveByKeywordsAndGetFileContentParamsType,
  googleOauthSearchDriveByKeywordsAndGetFileContentOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import searchDriveByQuery from "./searchDriveByQuery.js";
import getDriveFileContentById from "./getDriveFileContentById.js";

const searchDriveByKeywordsAndGetFileContent: googleOauthSearchDriveByKeywordsAndGetFileContentFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthSearchDriveByKeywordsAndGetFileContentParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthSearchDriveByKeywordsAndGetFileContentOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { searchQuery, limit, searchDriveByDrive, orderByQuery, fileSizeLimit: maxChars } = params;

  // First, perform the search
  const query = searchQuery
    .split(" ")
    .map(kw => kw.replace(/'/g, "\\'"))
    .map(kw => `fullText contains '${kw}' or name contains '${kw}'`)
    .join(" or ");
  const searchResult = await searchDriveByQuery({
    params: { query, limit, searchDriveByDrive, orderByQuery },
    authParams,
  });

  // If search failed, return error
  if (!searchResult.success) {
    return { success: false, error: searchResult.error, files: [] };
  }

  // For each file, fetch its content in parallel
  const files = searchResult.files ?? [];
  const contentPromises = files.map(async file => {
    try {
      const contentResult = await getDriveFileContentById({
        params: { fileId: file.id, limit: maxChars },
        authParams,
      });
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: file.url,
        content: contentResult.success ? contentResult.content : undefined,
      };
    } catch (error) {
      console.error(`Error fetching content for file ${file.id}:`, error);
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: file.url,
      };
    }
  });

  const filesWithContent = await Promise.all(contentPromises);

  // Return combined results
  return { success: true, files: filesWithContent };
};

export default searchDriveByKeywordsAndGetFileContent;
