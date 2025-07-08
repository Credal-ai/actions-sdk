import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthSearchDriveAndGetContentByKeywordsFunction,
  googleOauthSearchDriveAndGetContentByKeywordsOutputType,
  googleOauthSearchDriveAndGetContentByKeywordsParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import extractContentFromDriveFileId from "./utils/extractContentFromDriveFileId.js";
import { normalizeText } from "../../../utils/string.js";

/** Intelligently selects a section of text around the median occurrence of keywords */
const intelligentSelectByMedianSection = (text: string, keywords: string[], limit: number): string => {
  if (!text || text.length <= limit) return text;
  if (!keywords?.length) return text.substring(0, limit);

  // Find all keyword positions (case-insensitive, limited to first 1000 matches)
  const positions: number[] = [];
  const normalizedText = normalizeText(text);

  for (const keyword of keywords) {
    if (keyword.length < 3) continue; // Skip very short keywords
    let pos = -1;
    const normalizedKeyword = normalizeText(keyword);
    while ((pos = normalizedText.indexOf(normalizedKeyword, pos + 1)) !== -1 && positions.length < 1000) {
      positions.push(pos);
    }
  }

  if (!positions.length) return text.substring(0, limit);

  // Find median position (using sort for simplicity, still fast for 1000 elements)
  positions.sort((a, b) => a - b);
  const medianPos = positions[Math.floor(positions.length / 2)];

  // Return window around median
  const half = Math.floor(limit / 2);
  const start = Math.max(0, medianPos - half);
  const end = Math.min(text.length, start + limit);

  return text.substring(start, end);
};

type FileMetadata = { id?: string; name?: string; mimeType?: string; url?: string };

const searchDriveAndGetContentByKeywords: googleOauthSearchDriveAndGetContentByKeywordsFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthSearchDriveAndGetContentByKeywordsParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthSearchDriveAndGetContentByKeywordsOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { keywords, fileLimit, fileSizeLimit } = params;
  let files: FileMetadata[] = [];

  // 1. Search for files and get their metadata
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
    files =
      res.data.files?.map((file: { id: string; name: string; mimeType: string; webViewLink: string }) => ({
        id: file.id as string,
        name: file.name as string,
        mimeType: file.mimeType as string,
        url: file.webViewLink as string,
      })) || [];
  } catch (error) {
    console.error("Error searching Google Drive", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      files: [],
    };
  }

  files = fileLimit ? files.splice(0, fileLimit) : files;

  // 2. Extract content from files and do some smart range selection
  const processedFiles = await Promise.all(
    (files as FileMetadata[])
      .filter((file: FileMetadata) => file.id && file.mimeType)
      .map(async (file: FileMetadata) => {
        const content = await extractContentFromDriveFileId({
          params: { fileId: file.id!, mimeType: file.mimeType! },
          authParams,
        });

        if (content.success) {
          let selectedContent = content.content;
          if (fileSizeLimit && selectedContent && selectedContent.length > fileSizeLimit) {
            selectedContent = intelligentSelectByMedianSection(selectedContent, keywords, fileSizeLimit);
          }

          return {
            id: file.id || "",
            name: file.name || "",
            mimeType: file.mimeType || "",
            url: file.url || "",
            content: selectedContent,
          };
        } else {
          return {
            id: file.id || "",
            name: file.name || "",
            mimeType: file.mimeType || "",
            url: file.url || "",
            error: content.error,
          };
        }
      }),
  );

  return { success: true, files: processedFiles };
};

export default searchDriveAndGetContentByKeywords;
