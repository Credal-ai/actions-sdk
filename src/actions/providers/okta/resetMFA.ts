import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaResetMFAFunction,
  oktaResetMFAOutputType,
  oktaResetMFAParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient";

const resetMFA: oktaResetMFAFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaResetMFAParamsType;
}): Promise<oktaResetMFAOutputType> => {
  const { authToken, baseUrl } = authParams;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "Missing Okta OAuth token (authToken) or base URL (baseUrl) in authParams.",
    };
  }

  try {
    let endpointUrl: string;
    let method: "POST" | "DELETE";
    if (params.factorId) {
      endpointUrl = new URL(`/api/v1/users/${params.userId}/factors/${params.factorId}`, baseUrl).toString();
      method = "DELETE";
    } else {
      endpointUrl = new URL(`/api/v1/users/${params.userId}/lifecycle/reset_factors`, baseUrl).toString();
      method = "POST";
    }

    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const response = await axiosClient.request({
      url: endpointUrl,
      method,
      data: method === "POST" ? {} : undefined,
      ...requestConfig,
    });

    if (response.status === 200 || (method === "DELETE" && response.status === 204)) {
      return { success: true };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
      return { success: false, error: `Failed to reset MFA factor(s): ${errorDetail}` };
    }
  } catch (error) {
    console.error("Error resetting MFA:", error);
    let errorMessage = "Unknown error while resetting MFA";

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

export default resetMFA;
