import type { AxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import type {
  AuthParamsType,
  oktaAddUserToGroupFunction,
  oktaAddUserToGroupOutputType,
  oktaAddUserToGroupParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const addUserToGroup: oktaAddUserToGroupFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaAddUserToGroupParamsType;
}): Promise<oktaAddUserToGroupOutputType> => {
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

    const endpointUrl = new URL(`/api/v1/groups/${params.groupId}/users/${params.userId}`, baseUrl).toString();
    const response = await axiosClient.put(endpointUrl, {}, requestConfig);

    if (response.status === 204) {
      return { success: true };
    } else {
      const errorDetail =
        response.data?.errorSummary || response.data?.message || `Okta API responded with status ${response.status}`;
      return { success: false, error: `Failed to add user to group: ${errorDetail}` };
    }
  } catch (error) {
    console.error("Error adding user to group:", error);
    let errorMessage = "Unknown error while adding user to group";

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

export default addUserToGroup;
