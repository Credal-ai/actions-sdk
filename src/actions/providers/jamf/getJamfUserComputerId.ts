import type {
  AuthParamsType,
  jamfGetJamfUserComputerIdFunction,
  jamfGetJamfUserComputerIdParamsType,
  jamfGetJamfUserComputerIdOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

type Computer = {
  id: string;
  name: string;
  userAndLocation: {
    email: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  // es-lint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const getJamfUserComputerId: jamfGetJamfUserComputerIdFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetJamfUserComputerIdParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetJamfUserComputerIdOutputType> => {
  const { authToken, subdomain } = authParams;
  const { userEmail } = params;

  if (!subdomain || !authToken) {
    throw new Error("Instance and authToken are required to fetch Jamf user computer ID");
  }

  const url = `https://${subdomain}.jamfcloud.com`;

  try {
    const computers = await axiosClient.get(`${url}/api/v1/computers-inventory`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    const filteredComputers: Computer[] = (computers.data.results as Computer[]).filter(
      computer => computer.userAndLocation?.email === userEmail,
    );

    if (filteredComputers.length === 0) {
      return {
        success: false,
        error: `No computers found for user with email: ${userEmail}`,
      };
    }

    return {
      success: true,
      computerId: filteredComputers[0].id,
    };
  } catch (error) {
    console.error("Error retrieving Jamf user computer ID: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getJamfUserComputerId;
