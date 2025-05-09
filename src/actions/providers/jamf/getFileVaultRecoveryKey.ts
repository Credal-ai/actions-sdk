import base64 from "base-64";
import type {
  AuthParamsType,
  jamfGetFileVaultRecoveryKeyFunction,
  jamfGetFileVaultRecoveryKeyOutputType,
  jamfGetFileVaultRecoveryKeyParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getFileVaultRecoveryKey: jamfGetFileVaultRecoveryKeyFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetFileVaultRecoveryKeyParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetFileVaultRecoveryKeyOutputType> => {
  const { username, password, baseUrl } = authParams;
  const { computerId } = params;

  if (!baseUrl || !computerId || !username || !password) {
    throw new Error("Base URL and Computer ID are required to fetch FileVault2 recovery key");
  }

  const apiUrl = `${baseUrl}/JSSResource/computers/${computerId}/FileVault2RecoveryKey`;
  const auth = "Basic " + base64.encode(`${username}:${password}`);

  try {
    const response = await axiosClient.get(apiUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error retrieving FileVault2 recovery key: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getFileVaultRecoveryKey;
