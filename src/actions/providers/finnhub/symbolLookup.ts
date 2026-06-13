import type {
  finnhubSymbolLookupFunction,
  finnhubSymbolLookupParamsType,
  finnhubSymbolLookupOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { finnhubSymbolLookupOutputSchema } from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const symbolLookup: finnhubSymbolLookupFunction = async ({
  params,
  authParams,
}: {
  params: finnhubSymbolLookupParamsType;
  authParams: AuthParamsType;
}): Promise<finnhubSymbolLookupOutputType> => {
  const apiKey = authParams.apiKey;
  const query = params.query;
  const encodedQuery = encodeURIComponent(query);

  const results: finnhubSymbolLookupOutputType["result"] = [];

  // Try exact symbol lookup via profile2 (works reliably for tickers like "AAPL")
  try {
    const profileResult = await axiosClient.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodedQuery}`, {
      headers: {
        "X-Finnhub-Token": apiKey,
      },
    });
    if (profileResult.data?.ticker && profileResult.data?.name) {
      results.push({
        symbol: profileResult.data.ticker,
        description: profileResult.data.name,
      });
    }
  } catch {
    // profile2 fails for non-symbols (expected); ignore and continue with search
  }

  // Fuzzy search via /search (works well for company names, ISINs, etc.)
  try {
    const searchResult = await axiosClient.get(`https://finnhub.io/api/v1/search?q=${encodedQuery}`, {
      headers: {
        "X-Finnhub-Token": apiKey,
      },
    });
    if (searchResult.data && Array.isArray(searchResult.data.result)) {
      for (const item of searchResult.data.result) {
        if (item?.symbol && item?.description) {
          // Avoid duplicates from profile2 result
          if (!results.some(r => r.symbol === item.symbol)) {
            results.push({
              symbol: item.symbol,
              description: item.description,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  return finnhubSymbolLookupOutputSchema.parse({
    result: results,
  });
};

export default symbolLookup;
