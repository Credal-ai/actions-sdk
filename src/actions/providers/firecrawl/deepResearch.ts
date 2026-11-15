import type {
  AuthParamsType,
  firecrawlDeepResearchFunction,
  firecrawlDeepResearchParamsType,
  firecrawlDeepResearchOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { firecrawlDeepResearchOutputSchema } from "../../autogen/types.js";

// Firecrawl shuts down /v1/deep-research on 2026-12-10, so deep research runs on the agent API.
// https://docs.firecrawl.dev/migrating-from-deep-research
const agentUrl = "https://api.firecrawl.dev/v2/agent";

// Asks the agent for the report and sources that deep research returned
const researchSchema = {
  type: "object",
  properties: {
    report: { type: "string", description: "A markdown report that answers the question" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: { url: { type: "string" }, title: { type: "string" } },
        required: ["url", "title"],
      },
    },
  },
  required: ["report", "sources"],
};

type FirecrawlStartResponse = {
  id: string; // researchJobId
  success?: boolean;
};

type FirecrawlPollResponse = {
  status: "processing" | "completed" | "failed";
  data?: {
    report?: string;
    sources?: Array<{ title: string; url: string }>;
  };
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
  const { query, timeLimit, maxCredits } = params;
  const { apiKey } = authParams;
  if (!apiKey) throw new Error("Missing Firecrawl API key");

  const headers = { Authorization: `Bearer ${apiKey}` };

  // 1) Kick off job
  const start = await axiosClient.post<FirecrawlStartResponse>(
    agentUrl,
    { prompt: query, schema: researchSchema, maxCredits },
    { headers },
  );

  if (!start.data?.id) {
    throw new Error(`Failed to start deep research (no job id). HTTP ${start.status}`);
  }

  const researchJobId = start.data.id;

  // 2) Poll until completion (with timeout + backoff)
  const pollUrl = `${agentUrl}/${researchJobId}`;
  let intervalMs = 1000; // start at 1s
  const maxIntervalMs = 5000; // cap at 5s
  const maxWaitMs = (typeof timeLimit === "number" && timeLimit > 0 ? timeLimit : 60) * 1000 + 15_000; // timeLimit + 15s buffer
  const deadline = Date.now() + maxWaitMs;

  // The agent has no time limit of its own, so a run we stop waiting for is cancelled instead of left spending credits
  const timeOut = async (message: string): Promise<never> => {
    await axiosClient.delete(pollUrl, { headers }).catch(() => undefined);
    throw new Error(message);
  };

  while (true) {
    const res = await axiosClient.get<FirecrawlPollResponse>(pollUrl, { headers });
    const data = res.data;

    if (!data?.status) {
      // Defensive: transient bad payload
      if (Date.now() > deadline) return timeOut("Deep research polling timed out (no status).");
      await sleep(intervalMs);
      intervalMs = Math.min(Math.floor(intervalMs * 1.5), maxIntervalMs);
      continue;
    }

    if (data.status === "completed") {
      // Validate + return
      return firecrawlDeepResearchOutputSchema.parse({
        finalAnalysis: data.data?.report ?? "",
        sources: data.data?.sources ?? [],
      });
    }

    if (data.status === "failed") {
      throw new Error(`Deep research ${data.status}. ${data.error ? `Reason: ${data.error}` : ""}`.trim());
    }

    // processing
    if (Date.now() > deadline) {
      return timeOut("Deep research polling timed out.");
    }
    await sleep(intervalMs);
    intervalMs = Math.min(Math.floor(intervalMs * 1.5), maxIntervalMs);
  }
};

export default deepResearch;
