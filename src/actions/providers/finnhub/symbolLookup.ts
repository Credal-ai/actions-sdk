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
      result: result.data.result,
    });
  } catch (error) {
    console.error(error);
    return finnhubSymbolLookupOutputSchema.parse({
      result: [],
    });
  }
};

export default symbolLookup;
