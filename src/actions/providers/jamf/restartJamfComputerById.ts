import type {
  AuthParamsType,
  jamfRestartJamfComputerByIdFunction,
  jamfRestartJamfComputerByIdParamsType,
  jamfRestartJamfComputerByIdOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const restartJamfComputerById: jamfRestartJamfComputerByIdFunction = async ({
  params,
  authParams,
}: {
  params: jamfRestartJamfComputerByIdParamsType;
  authParams: AuthParamsType;
}): Promise<jamfRestartJamfComputerByIdOutputType> => {
  const { authToken, subdomain } = authParams;
  const { computerId } = params;

  if (!subdomain || !authToken) {
    throw new Error("Instance and authToken are required to fetch Jamf user computer ID");
  }

  const url = `https://${subdomain}.jamfcloud.com`;

  try {
    await axiosClient.post(`${url}/api/command/v1/computers/${computerId}/restart`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error restarting Jamf computer: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default restartJamfComputerById;
