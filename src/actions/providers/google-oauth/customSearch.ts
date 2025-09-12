import { axiosClient } from "../../util/axiosClient.js";
import type { AxiosResponse } from "axios";
import type {
  AuthParamsType,
  googleOauthCustomSearchFunction,
  googleOauthCustomSearchOutputType,
  googleOauthCustomSearchParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

// https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list#request
const customSearch: googleOauthCustomSearchFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCustomSearchParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCustomSearchOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const url = "https://customsearch.googleapis.com/customsearch/v1";

  try {
    // Filter out undefined values from params
    const queryParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));

    // Add API key to query parameters
    queryParams.key = authParams.authToken;

    const { query, customSearchEngineId, ...filteredParams } = queryParams;

    const res: AxiosResponse = await axiosClient.get(url, {
      params: {
        q: query,
        cx: customSearchEngineId,
        filter: "1", // filter out duplicate content
        safe: "active", // safe search
        ...filteredParams,
      },
    });

    const { items = [], searchInformation } = res.data;

    // Transform the response to match our schema
    const results = items
      .map((item: { title?: string; link?: string; snippet?: string; displayLink?: string }) => ({
        title: item.title ?? "",
        link: item.link ?? "",
        snippet: item.snippet ?? "",
        displayLink: item.displayLink ?? "",
      }))
      .filter((item: { link: string | undefined }) => item.link !== undefined);

    return {
      success: true,
      items: results,
      searchInformation: searchInformation
        ? {
            searchTime: searchInformation.searchTime,
            totalResults: searchInformation.totalResults,
          }
        : undefined,
    };
  } catch (error: unknown) {
    let errorMessage = "Unknown error performing search";

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string; code?: string } } } };
      if (axiosError.response?.data?.error) {
        const apiError = axiosError.response.data.error;
        errorMessage = apiError.message || `API Error: ${apiError.code}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export default customSearch;
