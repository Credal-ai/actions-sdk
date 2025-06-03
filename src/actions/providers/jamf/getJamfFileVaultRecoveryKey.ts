import type {
  AuthParamsType,
  jamfGetJamfFileVaultRecoveryKeyFunction,
  jamfGetJamfFileVaultRecoveryKeyOutputType,
  jamfGetJamfFileVaultRecoveryKeyParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { TokenResponseSchema } from "./types";

const getJamfFileVaultRecoveryKey: jamfGetJamfFileVaultRecoveryKeyFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetJamfFileVaultRecoveryKeyParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetJamfFileVaultRecoveryKeyOutputType> => {
  const { username, password, subdomain } = authParams;
  const { computerId } = params;

  if (!subdomain || !username || !password) {
    throw new Error("Base URL, username, and password are required to fetch FileVault2 recovery key");
  }

  // const apiUrl = `${baseUrl}/api/v1/computers-inventory/${computerId}/filevault`;
  const url = `https://${subdomain}.jamfcloud.com`;
  const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  console.log("Fetching FileVault2 recovery key for computer ID:", computerId, auth, url);

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

    const fileVaultResponse = await axiosClient.get(`${url}/api/v1/computers-inventory/${computerId}/filevault`, {
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
      data: fileVaultResponse.data,
    };
  } catch (error) {
    console.error("Error retrieving FileVault2 recovery key: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getJamfFileVaultRecoveryKey;
