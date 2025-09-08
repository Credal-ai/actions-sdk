import FirecrawlApp from "@mendable/firecrawl-js";
import type {
  firecrawlScrapeUrlFunction,
  firecrawlScrapeUrlParamsType,
  firecrawlScrapeUrlOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { firecrawlScrapeUrlOutputSchema } from "../../autogen/types.js";

const scrapeUrl: firecrawlScrapeUrlFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlScrapeUrlParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlScrapeUrlOutputType> => {
  const firecrawl = new FirecrawlApp({
    apiKey: authParams.apiKey,
  });

  const result = await firecrawl.scrapeUrl(params.url, {
    ...(params.waitMs !== undefined && {
      actions: [{ type: "wait", milliseconds: params.waitMs }],
    }),
  });

  return firecrawlScrapeUrlOutputSchema.parse({
    content: result.success ? result.markdown : "",
  });
};

export default scrapeUrl;
