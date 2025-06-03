import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaListOktaGroupsFunction,
  oktaListOktaGroupsOutputType,
  oktaListOktaGroupsParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

// page limit 200 recomended by Okta documentation
// https://developer.okta.com/docs/api/openapi/okta-management/management/tag/Group/#tag/Group/operation/listGroups
const DEFAULT_LIMIT = 200;

const listOktaGroups: oktaListOktaGroupsFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaListOktaGroupsParamsType;
}): Promise<oktaListOktaGroupsOutputType> => {
  const { authToken, baseUrl } = authParams;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "Missing Okta OAuth token (authToken) or base URL (baseUrl) in authParams.",
    };
  }

  try {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const endpointUrl = new URL("/api/v1/groups", baseUrl);
    endpointUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, params.maxResults || DEFAULT_LIMIT).toString());
    if (params.searchQuery) {
      endpointUrl.searchParams.set("search", params.searchQuery);
    }
    if (!params.maxResults) {
      endpointUrl.searchParams.set("limit", DEFAULT_LIMIT.toString());
    }
    let nextUrl = endpointUrl.toString();

    let groups: Array<{
      id: string;
      profile: {
        name: string;
        description: string;
      };
    }> = [];
    let totalFetched = 0;

    while (nextUrl) {
      const remainingResults = params.maxResults ? params.maxResults - totalFetched : DEFAULT_LIMIT;
      const adjustedUrl = new URL(nextUrl);
      if (params.maxResults && remainingResults < DEFAULT_LIMIT) {
        adjustedUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, remainingResults).toString());
      }

      const response = await axiosClient.get(adjustedUrl.toString(), requestConfig);

      if (response.status === 200 && Array.isArray(response.data)) {
        groups = groups.concat(
          response.data.map(group => ({
            id: group.id,
            profile: {
              name: group.profile.name,
              description: group.profile.description,
            },
          })),
        );

        totalFetched += response.data.length;
        if (params.maxResults && totalFetched >= params.maxResults) {
          groups = groups.slice(0, params.maxResults);
          break;
        }

        nextUrl = response.headers.link?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
        if (nextUrl) {
          console.debug("Next page URL:", nextUrl);
        }
      } else {
        const errorDetail =
          response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
        return { success: false, error: `Failed to list groups: ${errorDetail}` };
      }
    }

    return { success: true, groups };
  } catch (error) {
    console.error("Error listing groups:", error);
    let errorMessage = "Unknown error while listing groups";

    if (error instanceof AxiosError && error.response) {
      const oktaError = error.response.data;
      errorMessage =
        oktaError?.errorSummary || oktaError?.message || `Okta API request failed with status ${error.response.status}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export default listOktaGroups;
