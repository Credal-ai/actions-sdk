import FirecrawlApp from "@mendable/firecrawl-js";
import type {
  AuthParamsType,
  firecrawlDeepResearchFunction,
  firecrawlDeepResearchParamsType,
  firecrawlDeepResearchOutputType,
} from "../../autogen/types";
import { firecrawlDeepResearchOutputSchema } from "../../autogen/types";

const deepResearch: firecrawlDeepResearchFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlDeepResearchParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlDeepResearchOutputType> => {
  const { query, maxDepth, maxUrls, timeLimit } = params;
  const firecrawl = new FirecrawlApp({
    apiKey: authParams.apiKey,
  });

  const result = await firecrawl.deepResearch(query, {
    maxDepth,
    maxUrls,
    timeLimit,
  });

  if (result.success && result.data) {
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
