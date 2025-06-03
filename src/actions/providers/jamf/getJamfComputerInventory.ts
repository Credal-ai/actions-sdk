import type {
  AuthParamsType,
  jamfGetJamfComputerInventoryFunction,
  jamfGetJamfComputerInventoryOutputType,
  jamfGetJamfComputerInventoryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { TokenResponseSchema } from "./types";

const getJamfComputerInventory: jamfGetJamfComputerInventoryFunction = async ({
  authParams,
}: {
  params: jamfGetJamfComputerInventoryParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetJamfComputerInventoryOutputType> => {
  const { username, password, subdomain } = authParams;

  if (!subdomain || !username || !password) {
    throw new Error("Base URL, username, and password are required to fetch FileVault2 recovery key");
  }

  const url = `https://${subdomain}.jamfcloud.com`;
  const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await axiosClient.post(
      `${url}/api/v1/auth/token`,
      {},
      {
        headers: {
          Authorization: auth,
          Accept: "application/json",
        },
      },
    );

    const token = TokenResponseSchema.parse(response.data).token;
    const computers = await axiosClient.get(`${url}/api/v1/computers-inventory`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    await axiosClient.post(
      `${url}/api/v1/auth/invalidate-token`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Accept all status codes so we can handle them manually
        validateStatus: () => true,
      },
    );

    return {
      success: true,
      data: computers.data,
    };
  } catch (error) {
    console.error("Error retrieving FileVault2 recovery key: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getJamfComputerInventory;
