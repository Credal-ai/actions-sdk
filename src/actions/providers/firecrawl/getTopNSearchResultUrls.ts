import Firecrawl from "@mendable/firecrawl-js";
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
    const app = new Firecrawl({ apiKey });

    // Firecrawl search (no scraping needed for URL list)
    const res = await app.search(searchQuery, { limit: count });

    if (!res.web) {
      throw new Error(`Firecrawl search failed: no web results returned`);
    }

    // Map Firecrawl results into a Bing-like shape your schema expects
    const results = res.web
      .filter(r => {
        // Handle both SearchResultWeb (has url) and Document (has sourceURL)
        return ("url" in r && r.url) || ("sourceURL" in r && r.sourceURL);
      })
      .map(r => {
        // Extract URL from either type
        const url = ("url" in r && r.url) || ("sourceURL" in r && r.sourceURL) || "";
        const title = r.title ?? ("metadata" in r && r.metadata?.title) ?? url;

        return {
          name: title as string,
          url: url as string,
        };
      });

    return { results };
  } catch (error) {
    console.error("Error fetching search results from Firecrawl:", error);
    throw error;
  }
};

export default getTopNSearchResultUrls;
