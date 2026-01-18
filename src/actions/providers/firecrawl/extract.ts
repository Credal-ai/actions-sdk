import type {
  AuthParamsType,
  firecrawlExtractFunction,
  firecrawlExtractParamsType,
  firecrawlExtractOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { firecrawlExtractOutputSchema } from "../../autogen/types.js";

type FirecrawlExtractStartResponse = {
  success: boolean;
  id: string;
  invalidURLs?: string[];
};

type FirecrawlExtractPollResponse = {
  success: boolean;
  status: "completed" | "processing" | "failed" | "cancelled";
  data?: Record<string, unknown>;
  sources?: Array<{ url: string; title?: string }>;
  expiresAt?: string;
  tokensUsed?: number;
  error?: string;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const extract: firecrawlExtractFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlExtractParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlExtractOutputType> => {
  const {
    urls,
    prompt,
    schema,
    enableWebSearch,
    ignoreSitemap,
    includeSubdomains,
    showSources,
    scrapeOptions,
    ignoreInvalidURLs,
    timeLimit,
  } = params;
  const { apiKey } = authParams;

  if (!apiKey) {
    throw new Error("Missing Firecrawl API key");
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  // Build request body, only including defined parameters
  const requestBody: Record<string, unknown> = { urls };
  if (prompt !== undefined) requestBody.prompt = prompt;
  if (schema !== undefined) requestBody.schema = schema;
  if (enableWebSearch !== undefined) requestBody.enableWebSearch = enableWebSearch;
  if (ignoreSitemap !== undefined) requestBody.ignoreSitemap = ignoreSitemap;
  if (includeSubdomains !== undefined) requestBody.includeSubdomains = includeSubdomains;
  if (showSources !== undefined) requestBody.showSources = showSources;
  if (scrapeOptions !== undefined) requestBody.scrapeOptions = scrapeOptions;
  if (ignoreInvalidURLs !== undefined) requestBody.ignoreInvalidURLs = ignoreInvalidURLs;

  // 1) Start the extraction job
  const startResponse = await axiosClient.post<FirecrawlExtractStartResponse>(
    "https://api.firecrawl.dev/v2/extract",
    requestBody,
    { headers }
  );

  if (!startResponse.data?.success || !startResponse.data?.id) {
    throw new Error(
      `Failed to start extraction job. HTTP ${startResponse.status}: ${JSON.stringify(startResponse.data)}`
    );
  }

  const extractionId = startResponse.data.id;

  // 2) Poll until completion (with timeout + exponential backoff)
  const pollUrl = `https://api.firecrawl.dev/v2/extract/${extractionId}`;
  let intervalMs = 1000; // Start at 1 second
  const maxIntervalMs = 5000; // Cap at 5 seconds
  const effectiveTimeLimit = typeof timeLimit === "number" && timeLimit > 0 ? timeLimit : 120;
  const maxWaitMs = effectiveTimeLimit * 1000 + 15_000; // timeLimit + 15s buffer
  const deadline = Date.now() + maxWaitMs;

  while (true) {
    const pollResponse = await axiosClient.get<FirecrawlExtractPollResponse>(pollUrl, { headers });
    const data = pollResponse.data;

    if (!data?.status) {
      // Transient bad payload - retry until deadline
      if (Date.now() > deadline) {
        throw new Error("Extract polling timed out (no status received).");
      }
      await sleep(intervalMs);
      intervalMs = Math.min(Math.floor(intervalMs * 1.5), maxIntervalMs);
      continue;
    }

    if (data.status === "completed") {
      // Validate and return
      return firecrawlExtractOutputSchema.parse({
        success: true,
        data: data.data ?? {},
        sources: data.sources ?? [],
        tokensUsed: data.tokensUsed,
      });
    }

    if (data.status === "failed" || data.status === "cancelled") {
      throw new Error(
        `Extraction ${data.status}. ${data.error ? `Reason: ${data.error}` : ""}`.trim()
      );
    }

    // Status is "processing" - continue polling
    if (Date.now() > deadline) {
      throw new Error("Extract polling timed out.");
    }
    await sleep(intervalMs);
    intervalMs = Math.min(Math.floor(intervalMs * 1.5), maxIntervalMs);
  }
};

export default extract;
