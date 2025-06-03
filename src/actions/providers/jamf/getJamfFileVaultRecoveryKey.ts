import type {
  AuthParamsType,
  jamfGetJamfFileVaultRecoveryKeyFunction,
  jamfGetJamfFileVaultRecoveryKeyOutputType,
  jamfGetJamfFileVaultRecoveryKeyParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getJamfFileVaultRecoveryKey: jamfGetJamfFileVaultRecoveryKeyFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetJamfFileVaultRecoveryKeyParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetJamfFileVaultRecoveryKeyOutputType> => {
  const { authToken, subdomain } = authParams;
  const { computerId } = params;

  if (!subdomain || !authToken) {
    throw new Error("Instance and authToken are required to fetch FileVault2 recovery key");
  }

  // const apiUrl = `${baseUrl}/api/v1/computers-inventory/${computerId}/filevault`;
  const url = `https://${subdomain}.jamfcloud.com`;

  try {
    const fileVaultResponse = await axiosClient.get(`${url}/api/v1/computers-inventory/${computerId}/filevault`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

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
