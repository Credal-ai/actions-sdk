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
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { query, limit, searchDriveByDrive, orderByQuery, fileSizeLimit } = params;

  // First, perform the search
  const searchResult = await searchDriveByQuery({
    params: { query, limit, searchDriveByDrive, orderByQuery },
    authParams,
  });

  // If search failed, return error
  if (!searchResult.success) {
    return { success: false, error: searchResult.error, files: [] };
  }

  // For each file, fetch its content
  const filesWithContent = [] as Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    content?: string;
  }>;
  const files = searchResult.files ?? [];
  for (const file of files) {
    try {
      const contentResult = await getDriveFileContentById({
        params: { fileId: file.id, limit: fileSizeLimit ?? 1000 },
        authParams,
      });
      filesWithContent.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: file.url,
        content: contentResult.success ? contentResult.content : undefined,
      });
    } catch (error) {
      console.error(`Error fetching content for file ${file.id}:`, error);
      filesWithContent.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: file.url,
      });
    }
  }

  // Return combined results
  return { success: true, files: filesWithContent };
};

export default searchDriveByQueryAndGetFileContent;
