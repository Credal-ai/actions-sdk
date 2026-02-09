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
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const {
    searchQuery,
    limit,
    searchDriveByDrive,
    orderByQuery,
    fileSizeLimit: maxChars,
    includeTrashed = false,
  } = params;

  // Hard limit on TOTAL characters across all files to prevent returning too much content
  const MAX_TOTAL_CHARS_LIMIT = 50000;
  const effectiveTotalMaxChars = maxChars ? Math.min(maxChars, MAX_TOTAL_CHARS_LIMIT) : MAX_TOTAL_CHARS_LIMIT;
  const PER_FILE_LIMIT = 10000; // Max chars to fetch per individual file

  const query = searchQuery
    .split(" ")
    .map(kw => kw.replace(/'/g, "\\'"))
    .map(kw => `fullText contains '${kw}' or name contains '${kw}'`)
    .join(" or ");
  const searchResult = await searchDriveByQuery({
    params: { query, limit, searchDriveByDrive, orderByQuery, includeTrashed },
    authParams,
  });

  // If search failed, return error
  if (!searchResult.success) {
    return { success: false, error: searchResult.error };
  }

  const files = searchResult.files ?? [];

  // File types that are likely to fail or have no useful text content
  const problematicMimeTypes = new Set([
    "application/vnd.google-apps.form",
    "application/vnd.google-apps.site",
    "application/vnd.google-apps.map",
    "application/vnd.google-apps.drawing",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Excel (not supported yet)
    "application/vnd.ms-excel",
  ]);

  // Filter out problematic files BEFORE processing to avoid wasting resources
  const validFiles = files
    .slice(0, limit)
    .filter(file => file.id && file.name && !problematicMimeTypes.has(file.mimeType));

  // Process only valid files and track total character count
  const filesWithContent: Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    content?: string;
  }> = [];
  let totalCharCount = 0;

  for (const file of validFiles) {
    // Stop if we've already hit the total character limit
    if (totalCharCount >= effectiveTotalMaxChars) {
      break;
    }

    try {
      // Calculate how many chars we can still fetch
      const remainingChars = effectiveTotalMaxChars - totalCharCount;
      const fetchLimit = Math.min(PER_FILE_LIMIT, remainingChars);

      const contentResult = await getDriveFileContentById({
        params: {
          fileId: file.id,
          limit: fetchLimit, // Limit to the smaller of per-file max or remaining chars
          timeoutLimit: 2,
        },
        authParams,
      });

      const content = contentResult.success ? contentResult.results?.[0]?.contents?.content : undefined;

      const contentLength = content?.length ?? 0;

      filesWithContent.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: file.url,
        content,
      });

      totalCharCount += contentLength;
    } catch {
      // Gracefully handle errors - add file without content
      filesWithContent.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: file.url,
        content: undefined,
      });
    }
  }

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

export default searchDriveByKeywordsAndGetFileContent;
