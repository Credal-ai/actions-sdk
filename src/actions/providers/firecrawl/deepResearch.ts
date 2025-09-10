import type {
  AuthParamsType,
  firecrawlDeepResearchFunction,
  firecrawlDeepResearchParamsType,
  firecrawlDeepResearchOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { firecrawlDeepResearchOutputSchema } from "../../autogen/types.js";

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

  const result = await axiosClient.post("https://api.firecrawl.com/v1/deepResearch", {
    headers: { Authorization: `Bearer ${apiKey}` },
    query,
    maxDepth,
    maxUrls,
    timeLimit,
  });

  if (result.status === 200 && result.data) {
    return firecrawlDeepResearchOutputSchema.parse({
      finalAnalysis: result.data.finalAnalysis,
      sources: result.data.sources,
    });
  }

  return {
    finalAnalysis: "Error",
    sources: [],
  };
};

export default deepResearch;
