import base64 from "base-64";
import type {
  AuthParamsType,
  jamfGetFileVaultRecoveryKeyFunction,
  jamfGetFileVaultRecoveryKeyOutputType,
  jamfGetFileVaultRecoveryKeyParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getJamfComputerInventory: jamfGetFileVaultRecoveryKeyFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetFileVaultRecoveryKeyParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetFileVaultRecoveryKeyOutputType> => {
  const { username, password, subdomain } = authParams;

  if (!subdomain || !username || !password) {
    throw new Error("Base URL, username, and password are required to fetch FileVault2 recovery key");
  }

  // const apiUrl = `${baseUrl}/api/v1/computers-inventory/${computerId}/filevault`;
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

    const token = response.data.token;
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
