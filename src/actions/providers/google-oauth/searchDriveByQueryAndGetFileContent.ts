// axiosClient not needed in this wrapper
import type {
  AuthParamsType,
  googleOauthSearchDriveByQueryAndGetFileContentFunction,
  googleOauthSearchDriveByQueryAndGetFileContentParamsType,
  googleOauthSearchDriveByQueryAndGetFileContentOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import searchDriveByQuery from "./searchDriveByQuery.js";
import getDriveFileContentById from "./getDriveFileContentById.js";

const searchDriveByQueryAndGetFileContent: googleOauthSearchDriveByQueryAndGetFileContentFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthSearchDriveByQueryAndGetFileContentParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthSearchDriveByQueryAndGetFileContentOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, results: [] };
  }

  const { query, limit, searchDriveByDrive, orderByQuery, fileSizeLimit: maxChars, includeTrashed = false } = params;

  // First, perform the search
  const searchResult = await searchDriveByQuery({
    params: { query, limit, searchDriveByDrive, orderByQuery, includeTrashed },
    authParams,
  });

  // If search failed, return error
  if (!searchResult.success) {
    return { success: false, error: searchResult.error, results: [] };
  }

  // For each file, fetch its content in parallel
  const files = searchResult.results ?? [];
  const contentPromises = files.map(async file => {
    try {
      const contentResult = await getDriveFileContentById({
        params: { fileId: file.contents.id, limit: maxChars },
        authParams,
      });
      return {
        id: file.contents.id,
        name: file.contents.name,
        mimeType: file.contents.mimeType,
        url: file.contents.url,
        content: contentResult.success ? contentResult.results?.[0]?.contents?.content : undefined,
      };
    } catch (error) {
      console.error(`Error fetching content for file ${file.contents.id}:`, error);
      return {
        id: file.contents.id,
        name: file.contents.name,
        mimeType: file.contents.mimeType,
        url: file.contents.url,
      };
    }
  });

  const filesWithContent = await Promise.all(contentPromises);

  // Return combined results
  return {
    success: true,
    results: filesWithContent.map(file => ({
      name: file.name,
      url: file.url,
      contents: file,
    })),
  };
};

export default searchDriveByQueryAndGetFileContent;
