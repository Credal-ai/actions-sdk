import {
  AuthParamsType,
  lookerEnableUserByEmailFunction,
  lookerEnableUserByEmailParamsType,
  lookerEnableUserByEmailOutputType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const enableUserByEmail: lookerEnableUserByEmailFunction = async ({
  params,
  authParams,
}: {
  params: lookerEnableUserByEmailParamsType;
  authParams: AuthParamsType;
}): Promise<lookerEnableUserByEmailOutputType> => {
  const { userEmail } = params;
  const { baseUrl, clientId, clientSecret, authToken } = authParams;

  if (!baseUrl) {
    throw new Error("Base URL is required for Looker API");
  }

  // Check for authentication params
  let accessToken = authToken;

  if (!accessToken && (!clientId || !clientSecret)) {
    throw new Error("Either authToken or both clientId and clientSecret are required for Looker API");
  }

  // Step 1: If no auth token is provided, authenticate using client_id and client_secret
  if (!accessToken && clientId && clientSecret) {
    console.log("Authenticating with Looker API:", baseUrl);
    try {
      // Use client_id and client_secret as URL query parameters
      const loginUrl = `${baseUrl}/api/4.0/login?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;

      const loginResponse = await axiosClient.post(loginUrl, {});

      accessToken = loginResponse.data.access_token;

      if (!accessToken) {
        throw new Error("Failed to obtain authentication token from Looker API");
      }
    } catch (error) {
      console.error("Error authenticating with Looker:", error);
      return {
        success: false,
        message: "Failed to authenticate with Looker API",
      };
    }
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Step 2: Search for the user by email
    const searchUrl = `${baseUrl}/api/4.0/users/search?email=${encodeURIComponent(userEmail)}`;
    console.log("Searching for user:", searchUrl);

    const searchResponse = await axiosClient.get(searchUrl, { headers });
    console.log("Search response:", searchResponse.data);

    const users = searchResponse.data;

    if (!users || users.length === 0) {
      return {
        success: false,
        message: `No user found with email: ${userEmail}`,
      };
    }

    const user = users[0]; // Take the first matching user

    // Step 3: Check if user is disabled
    if (!user.is_disabled) {
      return {
        success: true,
        message: `User ${userEmail} is already enabled`,
        userId: user.id,
        userDetails: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          isDisabled: user.is_disabled,
        },
      };
    }

    // Step 4: Enable the user (no confirmation check, automatically enable)
    const updateUrl = `${baseUrl}/api/4.0/users/${user.id}`;
    console.log("Enabling user:", updateUrl);

    const updateResponse = await axiosClient.patch(
      updateUrl,
      {
        is_disabled: false,
      },
      { headers },
    );

    console.log("Update response:", updateResponse.data);

    const updatedUser = updateResponse.data;

    return {
      success: true,
      message: `Successfully enabled user ${userEmail}`,
      userId: updatedUser.id,
      userDetails: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        isDisabled: updatedUser.is_disabled,
      },
    };
  } catch (error) {
    console.error("Error in Looker enableUserByEmail action:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default enableUserByEmail;
