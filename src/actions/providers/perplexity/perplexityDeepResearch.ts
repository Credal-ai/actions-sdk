import type {
  AuthParamsType,
  perplexityPerplexityDeepResearchFunction,
  perplexityPerplexityDeepResearchParamsType,
  perplexityPerplexityDeepResearchOutputType,
} from "../../autogen/types.js";
import { perplexityPerplexityDeepResearchOutputSchema } from "../../autogen/types.js";

interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface PerplexityUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  reasoning_tokens?: number;
  search_queries?: number;
}

interface PerplexityApiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  search_results?: PerplexitySearchResult[];
  usage?: PerplexityUsage;
}

const perplexityDeepResearch: perplexityPerplexityDeepResearchFunction = async ({
  params,
  authParams,
}: {
  params: perplexityPerplexityDeepResearchParamsType;
  authParams: AuthParamsType;
}): Promise<perplexityPerplexityDeepResearchOutputType> => {
  const { query, reasoningEffort = "medium" } = params;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authParams.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [{ role: "user", content: query }],
        reasoning_effort: reasoningEffort,
      }),
    });

    if (!response.ok) {
      return perplexityPerplexityDeepResearchOutputSchema.parse({
        success: false,
        error: `Perplexity API error: ${response.status} ${response.statusText}`,
      });
    }
    const result: PerplexityApiResponse = await response.json();

    const content = result.choices?.[0]?.message?.content || "";
    const sources =
      result.search_results?.map((source: PerplexitySearchResult) => ({
        title: source.title,
        url: source.url,
        snippet: source.snippet,
      })) || [];

    const usage = {
      input_tokens: result.usage?.prompt_tokens,
      output_tokens: result.usage?.completion_tokens,
      reasoning_tokens: result.usage?.reasoning_tokens,
      search_queries: result.usage?.search_queries,
    };

    return perplexityPerplexityDeepResearchOutputSchema.parse({
      success: true,
      result: {
        content,
        sources,
        usage,
      },
    });
  } catch (error) {
    return perplexityPerplexityDeepResearchOutputSchema.parse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default perplexityDeepResearch;
