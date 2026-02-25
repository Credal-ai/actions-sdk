import FirecrawlApp from "@mendable/firecrawl-js";
import type {
  AuthParamsType,
  firecrawlScrapeTweetDataWithNitterFunction,
  firecrawlScrapeTweetDataWithNitterParamsType,
  firecrawlScrapeTweetDataWithNitterOutputType,
} from "../../autogen/types.js";
import { MISSING_API_KEY } from "../../util/missingAuthConstants.js";

const scrapeTweetDataWithNitter: firecrawlScrapeTweetDataWithNitterFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlScrapeTweetDataWithNitterParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlScrapeTweetDataWithNitterOutputType> => {
  const tweetUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)(?:\?.*)?$/;

  if (!tweetUrlRegex.test(params.tweetUrl)) {
    throw new Error(
      "Invalid tweet URL. Expected format: https://twitter.com/username/status/id or https://x.com/username/status/id",
    );
  }
  const nitterUrl = params.tweetUrl.replace(
    /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)/i,
    "https://nitter.net",
  );

  // Initialize Firecrawl
  if (!authParams.apiKey) {
    throw new Error(MISSING_API_KEY);
  }

  const firecrawl = new FirecrawlApp({
    apiKey: authParams.apiKey,
  });

  try {
    // Scrape the Nitter URL
    // @ts-expect-error zeroDataRetention is not specified in the firecrawl types
    const result = await firecrawl.scrape(nitterUrl, { zeroDataRetention: true });

    // Extract the tweet text from the scraped content - simple approach - in practice, you might need more robust parsing based on nitter html structure
    const tweetContent = result.markdown;

    return {
      text: tweetContent || "Error scraping with firecrawl",
    };
  } catch (error) {
    throw new Error(`Error scraping tweet: ${error instanceof Error ? error.message : error}`, { cause: error });
  }
};

export default scrapeTweetDataWithNitter;
