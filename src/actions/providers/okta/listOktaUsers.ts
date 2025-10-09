import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaListOktaUsersFunction,
  oktaListOktaUsersOutputType,
  oktaListOktaUsersParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getOktaAdminUrl } from "./listOktaGroups.js";

// page limit default in Okta documentation
// https://developer.okta.com/docs/api/openapi/okta-management/management/tag/User/#tag/User/operation/listUsers
const DEFAULT_LIMIT = 200;

const listOktaUsers: oktaListOktaUsersFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaListOktaUsersParamsType;
}): Promise<oktaListOktaUsersOutputType> => {
  const { authToken, baseUrl } = authParams;

  if (!authToken || !baseUrl) {
    return {
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

    const endpointUrl = new URL("/api/v1/users", baseUrl);
    if (params.searchQuery) {
      endpointUrl.searchParams.set("search", params.searchQuery);
    }
    if (params.maxResults) {
      endpointUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, params.maxResults).toString());
    } else {
      endpointUrl.searchParams.set("limit", DEFAULT_LIMIT.toString());
    }
    let nextUrl = endpointUrl.toString();
    let users: oktaListOktaUsersOutputType["results"] = [];
    let totalFetched = 0;

    while (nextUrl) {
      const remainingResults = params.maxResults ? params.maxResults - totalFetched : DEFAULT_LIMIT;
      const adjustedUrl = new URL(nextUrl);
      if (params.maxResults && remainingResults < DEFAULT_LIMIT) {
        adjustedUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, remainingResults).toString());
      }

      const response = await axiosClient.get(adjustedUrl.toString(), requestConfig);

      if (response.status === 200 && Array.isArray(response.data)) {
        users = users.concat(
          response.data.map((user: Record<string, unknown>) => ({
            name: (() => {
              const profile = user.profile as Record<string, unknown>;
              if (profile?.firstName && profile?.lastName) {
                return `${profile.firstName} ${profile.lastName}`.trim();
              }
              return (profile?.email as string) || (user.id as string) || "Unknown User";
            })(),
            url: `${getOktaAdminUrl(baseUrl)}/admin/user/profile/view/${user.id}`,
            contents: user as {
              id: string;
              profile: {
                email?: string;
                firstName?: string;
                lastName?: string;
                login?: string;
                secondEmail?: string | null;
                mobilePhone?: string;
              };
            },
          })),
        );

        totalFetched += response.data.length;
        if (params.maxResults && totalFetched >= params.maxResults) {
          users = users.slice(0, params.maxResults);
          break;
        }

        nextUrl = response.headers.link?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
        if (nextUrl) {
          console.debug("Next page URL:", nextUrl);
        }
      } else {
        const errorDetail =
          response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
        return { error: `Failed to list Okta users: ${errorDetail}` };
      }
    }

    return {
      results: users,
    };
  } catch (error) {
    console.error("Error listing Okta users:", error);
    let errorMessage = "Unknown error while listing Okta users";

    if (error instanceof AxiosError && error.response) {
      const oktaError = error.response.data;
      errorMessage =
        oktaError?.errorSummary || oktaError?.message || `Okta API request failed with status ${error.response.status}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      error: errorMessage,
    };
  }
};

export default listOktaUsers;
