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
  try {
    const apiKey = authParams.apiKey;
    const result = await axiosClient.get(`https://finnhub.io/api/v1/search?q=${params.query}`, {
      headers: {
        "X-Finnhub-Token": apiKey,
      },
    });

    return finnhubSymbolLookupOutputSchema.parse({
      success: true,
      results: result.data.result.map((item: { description?: string; symbol: string }) => ({
        name: item.description || item.symbol || "Unknown Symbol",
        url: `https://finnhub.io/quote/${item.symbol}`,
        contents: item,
      })),
    });
  } catch (error) {
    console.error(error);
    return finnhubSymbolLookupOutputSchema.parse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    });
  }
};

export default symbolLookup;
