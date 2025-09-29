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

// Helper function to process files in batches with concurrency control
const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 3
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processor));
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }
  
  return results;
};

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
    'application/vnd.google-apps.form',
    'application/vnd.google-apps.site',
    'application/vnd.google-apps.map',
    'application/vnd.google-apps.drawing',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (not supported yet)
    'application/vnd.ms-excel',
  ]);
  
  // Filter out problematic files BEFORE processing to avoid wasting resources
  const validFiles = files
    .slice(0, limit)
    .filter(file => file.id && file.name && !problematicMimeTypes.has(file.mimeType));
  
  // Process only valid files in smaller batches to avoid overwhelming the API
  const filesWithContent = await processBatch(
    validFiles,
    async (file) => {
      try { 

        // Add timeout for individual file content requests with shorter timeout
        const contentResult = await getDriveFileContentById({
          params: { 
            fileId: file.id, 
            limit: maxChars,
            timeoutLimit: 2
          },
          authParams,
        });
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          url: file.url,
          content: contentResult.success ? contentResult.results?.[0]?.contents?.content : undefined,
        };
      } catch (error) {
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          url: file.url,
          content: undefined, // Gracefully handle errors
        };
      }
    },
    5 // Reduced to 5 files concurrently for better stability
  );

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
