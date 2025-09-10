import FirecrawlApp, { type SearchResultWeb } from "@mendable/firecrawl-js";
import type {
  AuthParamsType,
  firecrawlGetTopNSearchResultUrlsFunction,
  firecrawlGetTopNSearchResultUrlsParamsType,
  firecrawlGetTopNSearchResultUrlsOutputType,
} from "../../autogen/types.js";

// NOTE: authParams.apiKey should now be your FIRECRAWL API key.
const getTopNSearchResultUrls: firecrawlGetTopNSearchResultUrlsFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlGetTopNSearchResultUrlsParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlGetTopNSearchResultUrlsOutputType> => {
  const { query, count = 5, site } = params;
  const { apiKey } = authParams;

  if (!apiKey) {
    throw new Error("Missing Firecrawl API key in auth parameters");
  }

  // Build the search query (preserve site: filter behavior)
  const searchQuery = `${query}${site ? ` site:${site}` : ""}`;

  try {
    const app = new FirecrawlApp({ apiKey });

    // Firecrawl search (no scraping needed for URL list)
    const res = await app.search(searchQuery, { limit: count });

    // Map Firecrawl results into a Bing-like shape your schema expects

    const webResults = (res.web ?? []) as SearchResultWeb[];
    const results = webResults.map(r => ({
      name: r.title ?? r.url,
      url: r.url,
    }));

    return { results };
  } catch (error) {
    console.error("Error fetching search results from Firecrawl:", error);
    throw error;
  }
};

export default getTopNSearchResultUrls;
