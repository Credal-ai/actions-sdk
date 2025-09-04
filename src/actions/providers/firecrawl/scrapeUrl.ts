import Firecrawl from "@mendable/firecrawl-js";
import type {
  firecrawlScrapeUrlFunction,
  firecrawlScrapeUrlParamsType,
  firecrawlScrapeUrlOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { firecrawlScrapeUrlOutputSchema } from "../../autogen/types.js";

// Retryable HTTP status codes
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

interface HttpError {
  response?: {
    status?: number;
  };
  code?: string;
  message?: string;
}

const isRetryableError = (error: unknown): boolean => {
  const httpError = error as HttpError;

  // Check for HTTP status codes
  if (httpError?.response?.status && RETRYABLE_STATUS_CODES.includes(httpError.response.status)) {
    return true;
  }

  // Check for network errors
  if (httpError?.code === "ECONNRESET" || httpError?.code === "ETIMEDOUT" || httpError?.code === "ENOTFOUND") {
    return true;
  }

  // Check for timeout errors
  if (httpError?.message?.toLowerCase().includes("timeout")) {
    return true;
  }

  return false;
};

const calculateDelay = (attempt: number): number => {
  // Exponential backoff with jitter
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
};

const scrapeUrl: firecrawlScrapeUrlFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlScrapeUrlParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlScrapeUrlOutputType> => {
  const firecrawl = new Firecrawl({
    apiKey: authParams.apiKey,
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await firecrawl.scrape(params.url);

      return firecrawlScrapeUrlOutputSchema.parse({
        content: result.markdown || "",
      });
    } catch (error) {
      lastError = error;

      // If this is the last attempt or the error is not retryable, throw it
      if (attempt === MAX_RETRIES || !isRetryableError(error)) {
        throw error;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt);
      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
};

export default scrapeUrl;
