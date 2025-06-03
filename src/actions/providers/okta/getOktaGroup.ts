import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaGetOktaGroupFunction,
  oktaGetOktaGroupOutputType,
  oktaGetOktaGroupParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getOktaGroup: oktaGetOktaGroupFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaGetOktaGroupParamsType;
}): Promise<oktaGetOktaGroupOutputType> => {
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

    const endpointUrl = new URL(`/api/v1/groups/${params.groupId}`, baseUrl).toString();
    const response = await axiosClient.get(endpointUrl, requestConfig);

    if (response.status === 200 && response.data) {
      const group = {
        id: response.data.id,
        created: response.data.created,
        lastUpdated: response.data.lastUpdated,
        lastMembershipUpdated: response.data.lastMembershipUpdated,
        objectClass: response.data.objectClass,
        type: response.data.type,
        profile: {
          name: response.data.profile.name,
          description: response.data.profile.description,
        },
        _links: {
          logo: response.data._links?.logo || [],
          users: response.data._links?.users || {},
          apps: response.data._links?.apps || {},
        },
      };
      return { success: true, group };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
      return { success: false, error: `Failed to retrieve group details: ${errorDetail}` };
    }
  } catch (error) {
    console.error("Error retrieving group details:", error);
    let errorMessage = "Unknown error while retrieving group details";

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

export default getOktaGroup;
