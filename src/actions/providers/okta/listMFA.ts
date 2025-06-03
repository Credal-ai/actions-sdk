import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaListMFAFunction,
  oktaListMFAOutputType,
  oktaListMFAParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const listMFA: oktaListMFAFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaListMFAParamsType;
}): Promise<oktaListMFAOutputType> => {
  const { authToken, baseUrl } = authParams;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "Missing Okta OAuth token (authToken) or base URL (baseUrl) in authParams.",
    };
  }

  try {
    const endpointUrl = new URL(`/api/v1/users/${params.userId}/factors`, baseUrl).toString();
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    };

    const response = await axiosClient.get(endpointUrl, requestConfig);

    if (response.status === 200) {
      return { success: true, factors: response.data };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
      return { success: false, error: `Failed to list MFA factors: ${errorDetail}` };
    }
  } catch (error) {
    console.error("Error listing MFA factors:", error);
    let errorMessage = "Unknown error while listing MFA factors";

    if (error instanceof AxiosError && error.response) {
      const oktaError = error.response.data;
      errorMessage =
        oktaError?.errorSummary || oktaError?.message || `Okta API request failed with status ${error.response.status}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
};

export default listMFA;
