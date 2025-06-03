import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaResetPasswordFunction,
  oktaResetPasswordOutputType,
  oktaResetPasswordParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const resetPassword: oktaResetPasswordFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaResetPasswordParamsType;
}): Promise<oktaResetPasswordOutputType> => {
  const { authToken, baseUrl } = authParams;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "Missing Okta OAuth token (authToken) or base URL (baseUrl) in authParams.",
    };
  }

  try {
    const endpointUrl = new URL(`/api/v1/users/${params.userId}/lifecycle/reset_password`, baseUrl);
    endpointUrl.searchParams.append("sendEmail", params.sendEmail.toString());
    if (params.revokeSessions !== undefined) {
      endpointUrl.searchParams.append("revokeSessions", params.revokeSessions.toString());
    }

    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const response = await axiosClient.post(endpointUrl.toString(), {}, requestConfig);

    if (response.status === 200) {
      return { success: true, resetPasswordUrl: response.data.resetPasswordUrl };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
      return { success: false, error: `Failed to reset password: ${errorDetail}` };
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    let errorMessage = "Unknown error while resetting password";

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

export default resetPassword;
