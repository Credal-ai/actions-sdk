import Firecrawl from "@mendable/firecrawl-js";
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
  const firecrawl = new Firecrawl({
    apiKey: authParams.apiKey,
  });

  const result = await firecrawl.deepResearch(query, {
    maxDepth,
    maxUrls,
    timeLimit,
  });

  if (result && result.finalAnalysis) {
    return firecrawlDeepResearchOutputSchema.parse({
      finalAnalysis: result.finalAnalysis,
      sources: result.sources || [],
    });
  }

  return {
    finalAnalysis: "Error",
    sources: [],
  };
};

export default deepResearch;
