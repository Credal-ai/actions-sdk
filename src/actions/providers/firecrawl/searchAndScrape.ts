import Firecrawl from "@mendable/firecrawl-js";
import type {
  firecrawlSearchAndScrapeOutputType,
  firecrawlSearchAndScrapeParamsType,
  firecrawlSearchAndScrapeFunction,
  AuthParamsType,
} from "../../autogen/types";

const searchAndScrape: firecrawlSearchAndScrapeFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlSearchAndScrapeParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlSearchAndScrapeOutputType> => {
  const { apiKey } = authParams;
  if (!apiKey) throw new Error("Missing Firecrawl API key");

  const app = new Firecrawl({ apiKey });

  const { query, count = 5, site } = params;
  const searchQuery = `${query}${site ? ` site:${site}` : ""}`;

  const searchRes = await app.search(searchQuery, {
    limit: count,
    scrapeOptions: {
      formats: ["markdown"],
      timeout: 7500,
    },
  });

  if (!searchRes || !Array.isArray(searchRes)) {
    return { results: [] };
  }

  const results = searchRes
    .map(r => {
      const url = r.url;
      const contents = r.markdown;
      const title = r.title ?? r.metadata?.title ?? null;
      if (!url || !contents || !title) return undefined;
      return { url, title, contents };
    })
    .filter(NotEmpty);

  return { results };
};

export default searchAndScrape;

function NotEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
