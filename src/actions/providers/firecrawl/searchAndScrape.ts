import FirecrawlApp, { type Document } from "@mendable/firecrawl-js";
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

  const app = new FirecrawlApp({ apiKey });

  const { query, count = 5, site } = params;
  const searchQuery = `${query}${site ? ` site:${site}` : ""}`;

  const searchRes = await app.search(searchQuery, {
    limit: count,
    scrapeOptions: {
      formats: ["markdown"],
      timeout: 7500,
    },
  });

  const webResults = (searchRes.web ?? []) as Document[];

  const results = webResults
    .map(r => {
      const url = r.metadata?.url as string;
      const contents = r.markdown;
      const title = r.metadata?.title ?? null;
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
