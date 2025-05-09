import type {
  AuthParamsType,
  jamfGetComputerInventoryFunction,
  jamfGetComputerInventoryOutputType,
  jamfGetComputerInventoryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getComputerInventory: jamfGetComputerInventoryFunction = async ({
  params,
  authParams,
}: {
  params: jamfGetComputerInventoryParamsType;
  authParams: AuthParamsType;
}): Promise<jamfGetComputerInventoryOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { section } = params;

  if (!baseUrl) {
    throw new Error("Base URL is required to fetch computer inventory");
  }

  const apiUrl = `${baseUrl}/v1/computer-inventory`;
  const queryParams: Record<string, string> = {};

  if (section) {
    queryParams.section = section;
  }

  try {
    const response = await axiosClient.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
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
