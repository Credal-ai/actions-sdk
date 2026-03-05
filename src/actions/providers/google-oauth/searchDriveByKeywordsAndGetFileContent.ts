// axiosClient not needed in this wrapper
import type {
  AuthParamsType,
  googleOauthSearchDriveByKeywordsAndGetFileContentFunction,
  googleOauthSearchDriveByKeywordsAndGetFileContentParamsType,
  googleOauthSearchDriveByKeywordsAndGetFileContentOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { summarizeContent, MAX_INPUT_CHARS } from "../../util/llmClient.js";
import searchDriveByQuery from "./searchDriveByQuery.js";
import getDriveFileContentById from "./getDriveFileContentById.js";

// We use this const in our search GDrive query; 20 is somewhat arbitrary
const PROCESSING_LIMIT = 20;

// This is the default "limit" for when "limit" is not provided in the call
const TOP_N = 5;

// This is the threshold for which we would attempt to shorten by way of summarization.
// 6000 is derived from TOP_N being 5; the context window of GPT-4o is about 30K.
// If we return 5 results * 6000 = 30K, we could fit it.
// Additionally, this threshold being smaller may start trading off valuable context
const CONTENTS_SIZE_LIMIT = 6000;

// This number is unfortunately due to the latency that's introduced when summarizing
// large(r) files. The latency of an LLM call is affected by both input AND output tokens.
// If this limit were larger, we would timeout.
//
// The summary size limit is, in a sense, similar to truncation except:
// Pros:
// * The limit is much smaller (a fifth) than CONTENTS_SIZE_LIMIT, which means we can
// have 5x the amount of turns as its upper bound.
// * The hope is that summaries are more packed with greater semantic meaning.
// Cons:
// * Introduces significant latency costs, which could be ameliorated with storage, but
// that's a whole thing.
// * 1200 is a very short summary that can be very lossy.
const SUMMARY_SIZE_LIMIT = 1200;

const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 3,
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processor));

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
};

// This function is not perfect.
// At the moment, it is not taking into account the context of the keywords.
// For example, it doesn't consider that a keyword like "Chloe", a name, is more important
// than a keyword like "like."
//
// We could potentially use something like TF-IDF to determine this semantic importance
// by deducing that a rare keyword is more important than a common one, but at this point,
// I'd rather just use a reranker or something.
const scoreFileByKeywords = (
  searchQuery: string,
  fileName: string,
  content: string | undefined,
): { score: number; keywordCoverage: number; rawTermFrequency: number; nameMatchCount: number } => {
  const keywords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(kw => kw.length > 0);

  if (keywords.length === 0) {
    return { score: 0, keywordCoverage: 0, rawTermFrequency: 0, nameMatchCount: 0 };
  }

  const lowerContent = (content ?? "").toLowerCase();
  const lowerName = fileName.toLowerCase();

  let matchedKeywords = 0;
  let rawTermFrequency = 0;
  let nameMatchCount = 0;

  for (const kw of keywords) {
    const contentMatches = lowerContent.split(kw).length - 1;
    if (contentMatches > 0) {
      matchedKeywords++;
      rawTermFrequency += contentMatches;
    }

    if (lowerName.includes(kw)) {
      nameMatchCount++;
    }
  }

  // Fraction of search keywords found in file content (0 to 1).
  // Weighted at 15x so a file matching all keywords (15 pts) far outranks
  // one matching a third (5 pts), even if the partial match has high frequency.
  const keywordCoverage = matchedKeywords / keywords.length;

  // 10 pts per keyword found in the file name. This is the strongest signal —
  // a file literally named after the search terms is almost certainly what the
  // user wants, and should outweigh any amount of content frequency.
  const nameMatchBonus = nameMatchCount * 10;

  // Flat 10-pt bonus when ALL keywords appear somewhere in the file's content,
  // to decisively separate full matches from partial ones.
  const fullCoverageBonus = keywordCoverage === 1 ? 10 : 0;

  // Log-scaled frequency as a tiebreaker only. No multiplier so even 300
  // occurrences (≈8.2 pts) can't outweigh a single name match (10 pts).
  const frequencyScore = Math.log2(rawTermFrequency + 1);

  const score = keywordCoverage * 15 + frequencyScore + nameMatchBonus + fullCoverageBonus;

  return { score, keywordCoverage, rawTermFrequency, nameMatchCount };
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

  const { searchQuery, limit, searchDriveByDrive, orderByQuery, summarySizeLimit, includeTrashed = false } = params;

  const keywords = searchQuery
    .split(/\s+/)
    .filter(kw => kw.length > 0)
    .map(kw => kw.replace(/'/g, "\\'"));

  const fetchLimit = Math.max(limit ?? PROCESSING_LIMIT, PROCESSING_LIMIT);

  // Here, what we are doing is first performing a search for all files that contain
  // all of the keywords.
  // Then, we perform a search for all files that contain any of the keywords.
  // We then combine the results of the two searches and deduplicate the files.
  const andQuery = keywords.map(kw => `(fullText contains '${kw}')`).join(" and ");
  const orQuery = keywords.map(kw => `fullText contains '${kw}'`).join(" or ");

  const [andResult, orResult] = await Promise.all([
    searchDriveByQuery({
      params: { query: andQuery, limit: fetchLimit, searchDriveByDrive, orderByQuery, includeTrashed },
      authParams,
    }),
    searchDriveByQuery({
      params: { query: orQuery, limit: fetchLimit, searchDriveByDrive, orderByQuery, includeTrashed },
      authParams,
    }),
  ]);

  const andFiles = andResult.success ? (andResult.files ?? []) : [];
  const orFiles = orResult.success ? (orResult.files ?? []) : [];

  const seenIds = new Set<string>();
  const files: typeof andFiles = [];
  for (const file of [...andFiles, ...orFiles]) {
    if (!seenIds.has(file.id)) {
      seenIds.add(file.id);
      files.push(file);
    }
  }

  // If we have no files, return error
  if (files.length === 0 && !andResult.success) {
    return { success: false, error: andResult.error };
  }

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

  const validFiles = files
    .filter(file => file.id && file.name && !problematicMimeTypes.has(file.mimeType))
    .slice(0, PROCESSING_LIMIT);

  // Process only valid files in smaller batches to avoid overwhelming the API
  const filesWithContent = await processBatch(
    validFiles,
    async file => {
      try {
        // Add timeout for individual file content requests with shorter timeout
        const contentResult = await getDriveFileContentById({
          params: {
            fileId: file.id,
            limit: MAX_INPUT_CHARS,
            timeoutLimit: 2,
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
      } catch {
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          url: file.url,
          content: undefined, // Gracefully handle errors
        };
      }
    },
    5, // Reduced to 5 files concurrently for better stability
  );

  // Score each file by keyword relevance and take the top N
  const scoredFiles = filesWithContent
    .map(file => ({
      ...file,
      ...scoreFileByKeywords(searchQuery, file.name, file.content),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit ?? TOP_N);

  const summarizedFiles = await processBatch(
    scoredFiles,
    async file => ({
      ...file,
      content:
        file.content && file.content.length > CONTENTS_SIZE_LIMIT
          ? await summarizeContent(file.content, file.name, summarySizeLimit ?? SUMMARY_SIZE_LIMIT)
          : file.content,
    }),
    3, // not sure if this would cause rate limiting erors
  );

  return {
    success: true,
    results: summarizedFiles.map(file => ({
      name: file.name,
      url: file.url,
      contents: {
        ...file,
      },
    })),
  };
};

export default searchDriveByKeywordsAndGetFileContent;
