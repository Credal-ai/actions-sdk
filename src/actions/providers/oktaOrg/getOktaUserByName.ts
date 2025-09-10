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

  let searchExpression: string;
  const tokens = params.name.trim().split(/\s+/);
  if (tokens.length === 1) {
    // Search first OR last name starts with token
    const t = tokens[0].replace(/"/g, '\\"');
    console.log("Filter is: ", `profile.firstName sw "${t}" or profile.lastName sw "${t}"`);
    searchExpression = `profile.firstName sw "${t}" or profile.lastName sw "${t}"`;
  } else {
    // Use first and last tokens; ignore middles
    const first = tokens[0].replace(/"/g, '\\"');
    const last = tokens[tokens.length - 1].replace(/"/g, '\\"');
    // choose sw (startsWith) or eq (exact) as you prefer
    searchExpression = `profile.firstName sw "${first}" and profile.lastName sw "${last}"`;
  }

  try {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
      params: {
        search: searchExpression,
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

    console.log("Response is: ", response.data);

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
