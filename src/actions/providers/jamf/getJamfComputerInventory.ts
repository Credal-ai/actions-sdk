import type {
  AuthParamsType,
  jamfGetJamfComputerInventoryFunction,
  jamfGetJamfComputerInventoryOutputType,
  jamfGetJamfComputerInventoryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getJamfComputerInventory: jamfGetJamfComputerInventoryFunction = async ({
  authParams,
}: {
  params: jamfGetJamfComputerInventoryParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetJamfComputerInventoryOutputType> => {
  const { authToken, subdomain } = authParams;

  if (!subdomain || !authToken) {
    throw new Error("Instance and authToken are required to fetch Jamf computer inventory");
  }

  const url = `https://${subdomain}.jamfcloud.com`;

  try {
    const computers = await axiosClient.get(`${url}/api/v1/computers-inventory`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      data: computers.data,
    };
  } catch (error) {
    console.error("Error retrieving Jamf computer inventory: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getJamfComputerInventory;
