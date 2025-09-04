import Firecrawl from "@mendable/firecrawl-js";
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
  const firecrawl = new Firecrawl({
    apiKey: authParams.apiKey,
  });

  const result = await firecrawl.scrape(params.url);

  return firecrawlScrapeUrlOutputSchema.parse({
    content: result.markdown || "",
  });
};

export default scrapeUrl;
