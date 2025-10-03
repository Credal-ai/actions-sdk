import {
  type bingGetTopNSearchResultUrlsFunction,
  type bingGetTopNSearchResultUrlsParamsType,
  type bingGetTopNSearchResultUrlsOutputType,
  type AuthParamsType,
  bingGetTopNSearchResultUrlsOutputSchema,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getTopNSearchResultUrls: bingGetTopNSearchResultUrlsFunction = async ({
  params,
  authParams,
}: {
  params: bingGetTopNSearchResultUrlsParamsType;
  authParams: AuthParamsType;
}): Promise<bingGetTopNSearchResultUrlsOutputType> => {
  const { query, count = 5, site } = params;
  const { apiKey } = authParams;

  // Build the search query
  const searchQuery = `${query}${site ? ` site:${site}` : ""}`;

  // Ensure we have an API key
  if (!apiKey) {
    throw new Error("Missing Bing API key in auth parameters");
  }

  try {
    // Call Bing Search API
    const response = await axiosClient.get("https://api.bing.microsoft.com/v7.0/search", {
      params: {
        q: searchQuery,
        count: count,
        responseFilter: "Webpages",
        mkt: "en-US",
      },
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    // Extract URLs and names from search results
    const searchResults = response.data.webPages?.value || [];

    return bingGetTopNSearchResultUrlsOutputSchema.parse({
      success: true,
      results: searchResults.map((result: { name?: string; title?: string; url: string }) => ({
        name: result.title || result.name || "Search Result",
        url: result.url,
        contents: result,
      })),
    });
  } catch (error) {
    console.error("Error fetching search results from Bing:", error);
    throw error;
  }
};

export default getTopNSearchResultUrls;
