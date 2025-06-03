import type { AxiosRequestConfig } from "axios";
import type {
  AuthParamsType,
  oktaGetOktaUserParamsType,
  oktaGetOktaUserOutputType,
  oktaGetOktaUserFunction,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getOktaUser: oktaGetOktaUserFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaGetOktaUserParamsType;
}): Promise<oktaGetOktaUserOutputType> => {
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

    const endpointUrl = new URL(`/api/v1/users/${params.userId}`, baseUrl).toString();
    const response = await axiosClient.get(endpointUrl, requestConfig);

    if (response.status === 200 && response.data) {
      return { success: true, user: response.data };
    } else {
      return { success: false, error: "Failed to retrieve user details" };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
};

export default getOktaUser;
