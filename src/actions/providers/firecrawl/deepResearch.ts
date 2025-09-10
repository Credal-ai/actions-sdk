import type {
  AuthParamsType,
  firecrawlDeepResearchFunction,
  firecrawlDeepResearchParamsType,
  firecrawlDeepResearchOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { firecrawlDeepResearchOutputSchema } from "../../autogen/types.js";

type FirecrawlStartResponse = {
  id: string; // researchJobId
  status?: string;
};

type FirecrawlPollResponse = {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  finalAnalysis?: string;
  sources?: Array<{ title?: string; url: string; snippet?: string }>;
  error?: string;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const deepResearch: firecrawlDeepResearchFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlDeepResearchParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlDeepResearchOutputType> => {
  const { query, maxDepth, maxUrls, timeLimit } = params;
  const { apiKey } = authParams;
  if (!apiKey) throw new Error("Missing Firecrawl API key");

  const headers = { Authorization: `Bearer ${apiKey}` };

  // 1) Kick off job
  const start = await axiosClient.post<FirecrawlStartResponse>(
    "https://api.firecrawl.dev/v1/deep-research",
    { query, maxDepth, maxUrls, timeLimit },
    { headers },
  );

  if (!start.data?.id) {
    throw new Error(`Failed to start deep research (no job id). HTTP ${start.status}`);
  }

  const researchJobId = start.data.id;

  // 2) Poll until completion (with timeout + backoff)
  const pollUrl = `https://api.firecrawl.dev/v1/deep-research/${researchJobId}`;
  let intervalMs = 1000; // start at 1s
  const maxIntervalMs = 5000; // cap at 5s
  const maxWaitMs = (typeof timeLimit === "number" && timeLimit > 0 ? timeLimit : 60) * 1000 + 15_000; // timeLimit + 15s buffer
  const deadline = Date.now() + maxWaitMs;

  while (true) {
    const res = await axiosClient.get<FirecrawlPollResponse>(pollUrl, { headers });
    const data = res.data;

    if (!data?.status) {
      // Defensive: transient bad payload
      if (Date.now() > deadline) throw new Error("Deep research polling timed out (no status).");
      await sleep(intervalMs);
      intervalMs = Math.min(Math.floor(intervalMs * 1.5), maxIntervalMs);
      continue;
    }

    if (data.status === "completed") {
      // Validate + return
      return firecrawlDeepResearchOutputSchema.parse({
        finalAnalysis: data.finalAnalysis ?? "",
        sources: data.sources ?? [],
      });
    }

    if (data.status === "failed" || data.status === "cancelled") {
      throw new Error(`Deep research ${data.status}. ${data.error ? `Reason: ${data.error}` : ""}`.trim());
    }

    // queued | running
    if (Date.now() > deadline) {
      throw new Error("Deep research polling timed out.");
    }
    await sleep(intervalMs);
    intervalMs = Math.min(Math.floor(intervalMs * 1.5), maxIntervalMs);
  }
};

export default deepResearch;
