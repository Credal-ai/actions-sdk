import type { AxiosRequestConfig } from "axios";
import type {
  AuthParamsType,
  oktaOrgGetOktaUserByNameParamsType,
  oktaOrgGetOktaUserByNameOutputType,
  oktaOrgGetOktaUserByNameFunction,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getOktaUserByName: oktaOrgGetOktaUserByNameFunction = async ({
  authParams,
  params,
}: {
  authParams: AuthParamsType;
  params: oktaOrgGetOktaUserByNameParamsType;
}): Promise<oktaOrgGetOktaUserByNameOutputType> => {
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
      params: {
        q: params.name,
      },
    };

    const endpointUrl = new URL(`/api/v1/users`, baseUrl).toString();
    const response = await axiosClient.get(endpointUrl, requestConfig);

    if (response.status !== 200) {
      return {
        success: false,
        error: `Failed to retrieve user details: ${response.data}`,
      };
    }

    if (response.data.length === 0) {
      return {
        success: false,
        error: `No user found with name: ${params.name}`,
      };
    }

    const user = response.data[0];
    return {
      success: true,
      user: {
        id: user.id,
        email: user.profile.email,
        title: user.profile.title,
        division: user.profile.division,
        department: user.profile.department,
      },
    };
  } catch (error) {
    console.error("Error retrieving user details:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
};

export default getOktaUserByName;
