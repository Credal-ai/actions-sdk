import type {
  AuthParamsType,
  firecrawlDeepResearchFunction,
  firecrawlDeepResearchParamsType,
  firecrawlDeepResearchOutputType,
} from "../../autogen/types.js";
import { firecrawlDeepResearchOutputSchema } from "../../autogen/types.js";

const deepResearch: firecrawlDeepResearchFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlDeepResearchParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlDeepResearchOutputType> => {
  const { query, maxDepth, maxUrls, timeLimit } = params;

  // Use direct API call since deepResearch is not available in v2 SDK
  // but the API endpoint is still active until June 2025
  const response = await fetch("https://api.firecrawl.dev/v1/deep-research", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authParams.apiKey}`,
    },
    body: JSON.stringify({
      query,
      maxDepth,
      maxUrls,
      timeLimit,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deep research failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.success && result.data) {
    return firecrawlDeepResearchOutputSchema.parse({
      finalAnalysis: result.data.finalAnalysis,
      sources: result.data.sources || [],
    });
  }

  return {
    finalAnalysis: "Error",
    sources: [],
  };
};

export default deepResearch;
