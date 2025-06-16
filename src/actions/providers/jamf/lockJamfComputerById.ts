import type {
  AuthParamsType,
  jamfLockJamfComputerByIdFunction,
  jamfLockJamfComputerByIdParamsType,
  jamfLockJamfComputerByIdOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const lockJamfComputerById: jamfLockJamfComputerByIdFunction = async ({
  params,
  authParams,
}: {
  params: jamfLockJamfComputerByIdParamsType;
  authParams: AuthParamsType;
}): Promise<jamfLockJamfComputerByIdOutputType> => {
  const { authToken, subdomain } = authParams;
  const { computerId } = params;

  if (!subdomain || !authToken) {
    throw new Error("Instance and authToken are required to fetch Jamf user computer ID");
  }

  const url = `https://${subdomain}.jamfcloud.com`;

  try {
    await axiosClient.post(`${url}/api/command/v1/computers/${computerId}/lock`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error locking Jamf computer: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default lockJamfComputerById;
