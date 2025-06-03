import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaListOktaGroupMembersFunction,
  oktaListOktaGroupMembersOutputType,
  oktaListOktaGroupMembersParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

// page limit recommended by Okta documentation
// https://developer.okta.com/docs/api/openapi/okta-management/management/tag/Group/#tag/Group/operation/listGroupUsers
const DEFAULT_LIMIT = 200;

const listOktaGroupMembers: oktaListOktaGroupMembersFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaListOktaGroupMembersParamsType;
}): Promise<oktaListOktaGroupMembersOutputType> => {
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

    const endpointUrl = new URL(`/api/v1/groups/${params.groupId}/users`, baseUrl);
    endpointUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, params.maxResults || DEFAULT_LIMIT).toString());
    let nextUrl = endpointUrl.toString();
    let members: Array<{
      id: string;
      status?: string;
      created?: string;
      activated?: string | null;
      statusChanged?: string | null;
      lastLogin?: string | null;
      lastUpdated?: string;
      passwordChanged?: string;
      type?: { id?: string };
      profile?: {
        firstName?: string;
        lastName?: string;
        mobilePhone?: string | null;
        secondEmail?: string | null;
        login?: string;
        email?: string;
      };
    }> = [];
    let totalFetched = 0;

    while (nextUrl) {
      const remainingResults = params.maxResults ? params.maxResults - totalFetched : DEFAULT_LIMIT;
      const adjustedUrl = new URL(nextUrl);
      if (params.maxResults && remainingResults < DEFAULT_LIMIT) {
        adjustedUrl.searchParams.set("limit", Math.min(DEFAULT_LIMIT, remainingResults).toString());
      }

      console.debug("Fetching group members from URL:", adjustedUrl.toString());
      const response = await axiosClient.get(adjustedUrl.toString(), requestConfig);

      if (response.status === 200 && Array.isArray(response.data)) {
        members = members.concat(
          response.data.map(user => ({
            id: user.id,
            status: user.status,
            created: user.created,
            activated: user.activated,
            statusChanged: user.statusChanged,
            lastLogin: user.lastLogin,
            lastUpdated: user.lastUpdated,
            passwordChanged: user.passwordChanged,
            type: user.type,
            profile: {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              mobilePhone: user.profile.mobilePhone,
              secondEmail: user.profile.secondEmail,
              login: user.profile.login,
              email: user.profile.email,
            },
          })),
        );

        totalFetched += response.data.length;
        if (params.maxResults && totalFetched >= params.maxResults) {
          members = members.slice(0, params.maxResults);
          break;
        }

        nextUrl = response.headers.link?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;
        if (nextUrl) {
          console.debug("Next page URL:", nextUrl);
        }
      } else {
        const errorDetail =
          response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
        return { success: false, error: `Failed to list group members: ${errorDetail}` };
      }
    }

    return { success: true, members };
  } catch (error) {
    console.error("Error listing group members:", error);
    let errorMessage = "Unknown error while listing group members";

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

export default listOktaGroupMembers;
