import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaListOktaUserGroupsFunction,
  oktaListOktaUserGroupsOutputType,
  oktaListOktaUserGroupsParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const DEFAULT_LIMIT = 200;

const listOktaUserGroups: oktaListOktaUserGroupsFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaListOktaUserGroupsParamsType;
}): Promise<oktaListOktaUserGroupsOutputType> => {
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

    const endpointUrl = new URL(`/api/v1/users/${params.userId}/groups`, baseUrl);
    if (params.maxResults) {
      endpointUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, params.maxResults).toString());
    } else {
      endpointUrl.searchParams.set("limit", DEFAULT_LIMIT.toString());
    }
    let nextUrl = endpointUrl.toString();
    let groups: oktaListOktaUserGroupsOutputType["groups"] = [];
    let totalFetched = 0;

    while (nextUrl) {
      const remainingResults = params.maxResults ? params.maxResults - totalFetched : DEFAULT_LIMIT;
      const adjustedUrl = new URL(nextUrl);
      if (params.maxResults && remainingResults < DEFAULT_LIMIT) {
        adjustedUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, remainingResults).toString());
      }

      const response = await axiosClient.get(adjustedUrl.toString(), requestConfig);

      if (response.status === 200 && Array.isArray(response.data)) {
        groups = groups.concat(response.data);

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
        return { success: false, error: `Failed to list user groups: ${errorDetail}` };
      }
    }

    return { success: true, groups };
  } catch (error) {
    console.error("Error listing user groups:", error);
    let errorMessage = "Unknown error while listing user groups";

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

export default listOktaUserGroups;
