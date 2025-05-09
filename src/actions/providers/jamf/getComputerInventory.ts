import type {
  AuthParamsType,
  jamfGetComputerInventoryFunction,
  jamfGetComputerInventoryOutputType,
  jamfGetComputerInventoryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import base64 from "base-64";

const getComputerInventory: jamfGetComputerInventoryFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetComputerInventoryParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetComputerInventoryOutputType> => {
  const { username, password, baseUrl } = authParams;
  const { section } = params;

  if (!baseUrl || !username || !password) {
    throw new Error("Base URL is required to fetch computer inventory");
  }

  const apiUrl = `${baseUrl}/api/v1/computer-inventory`;
  const queryParams: Record<string, string> = {};

  if (section) {
    queryParams.section = section;
  }

  const auth = "Basic " + base64.encode(`${username}:${password}`);

  try {
    const response = await axiosClient.get(apiUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      params: queryParams,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error retrieving computer inventory: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getComputerInventory;
