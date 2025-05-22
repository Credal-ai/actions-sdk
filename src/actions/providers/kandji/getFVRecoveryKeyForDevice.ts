import {
  type kandjiGetFVRecoveryKeyForDeviceParamsType,
  type kandjiGetFVRecoveryKeyForDeviceOutputType,
  type AuthParamsType,
  type kandjiGetFVRecoveryKeyForDeviceFunction,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

type User = {
  email: string;
  name: string;
  id: string;
  is_archived: boolean;
};

type Device = {
  device_id: string;
  device_name: string;
  model: string;
  serial_number: string;
  user?: User;
};

const getFVRecoveryKeyForDevice: kandjiGetFVRecoveryKeyForDeviceFunction = async ({
  params,
  authParams,
}: {
  params: kandjiGetFVRecoveryKeyForDeviceParamsType;
  authParams: AuthParamsType;
}): Promise<kandjiGetFVRecoveryKeyForDeviceOutputType> => {
  const { userEmail, subdomain } = params;
  const { apiKey } = authParams;
  if (!apiKey) {
    throw new Error("Missing API key in auth parameters");
  }
  try {
    // First list all devices to get the device for the specific device
    const device = await getDeviceByEmail({
      apiKey,
      userEmail,
      subdomain,
    });
    if (!device) {
      return {
        success: false,
        error: "Device not found for the given serial number",
      };
    }

    // Then get the FV recovery key for that device
    const fvRecoveryKey: { data: { key: string } } = await axiosClient.get(
      `https://${subdomain}.api.kandji.io/api/v1/devices/${device.device_id}/secrets/filevaultkey`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
    if (!fvRecoveryKey || !fvRecoveryKey.data || !fvRecoveryKey.data.key) {
      return {
        success: false,
        error: "FireVault recovery key not found",
      };
    }
    return {
      success: true,
      recoveryKey: fvRecoveryKey.data.key,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

async function getDeviceByEmail(input: {
  apiKey: string;
  userEmail: string;
  subdomain: string;
}): Promise<Device | null> {
  const limit = 300;
  let offset = 0;
  const { apiKey, userEmail, subdomain } = input;

  while (true) {
    // Update params
    const params = { limit, offset };

    const endpoint = `https://${subdomain}.api.kandji.io/api/v1/devices`;

    const response = await axiosClient.get(endpoint, {
      params: {
        ...params,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    for (const device of response.data) {
      if (device.user && device.user.email === userEmail) {
        // If the device user email matches, return the device
        return device;
      }
    }
    offset += limit;
    if (response.data.length === 0) {
      break;
    }
  }
  return null;
}

export default getFVRecoveryKeyForDevice;
