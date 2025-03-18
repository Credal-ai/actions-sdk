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
  const { userEmail, clientId, clientSecret } = params;
  const { baseUrl } = authParams;

  if (!baseUrl) {
    throw new Error("Base URL is required for Looker API");
  }

  // Check for authentication params
  const authClientId = clientId || authParams.clientId;
  const authClientSecret = clientSecret || authParams.clientSecret;
  let authToken = authParams.authToken;

  if (!authToken && (!authClientId || !authClientSecret)) {
    throw new Error("Either authToken or both clientId and clientSecret are required for Looker API");
  }

  // Step 1: If no auth token is provided, authenticate using client_id and client_secret
  if (!authToken) {
    try {
      const loginResponse = await axiosClient.post(
        `${baseUrl}/login`,
        {
          client_id: authClientId,
          client_secret: authClientSecret,
        }
      );

      authToken = loginResponse.data.access_token;
      
      if (!authToken) {
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
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Step 2: Search for the user by email
    const searchResponse = await axiosClient.get(
      `${baseUrl}/api/4.0/users/search?email=${encodeURIComponent(userEmail)}`,
      { headers }
    );

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
    const updateResponse = await axiosClient.patch(
      `${baseUrl}/api/4.0/users/${user.id}`,
      {
        is_disabled: false
      },
      { headers }
    );

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