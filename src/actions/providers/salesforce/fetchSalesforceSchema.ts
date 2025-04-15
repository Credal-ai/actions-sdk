import type {
  AuthParamsType,
  salesforceFetchSalesforceSchemaByObjectFunction,
  salesforceFetchSalesforceSchemaByObjectOutputType,
  salesforceFetchSalesforceSchemaByObjectParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const fetchSalesforceSchemaByObject: salesforceFetchSalesforceSchemaByObjectFunction = async ({
  params,
  authParams,
}: {
  params: salesforceFetchSalesforceSchemaByObjectParamsType;
  authParams: AuthParamsType;
}): Promise<salesforceFetchSalesforceSchemaByObjectOutputType> => {
  const { authToken, baseUrl } = authParams;
  const { objectType } = params;

  if (!authToken || !baseUrl) {
    return {
      success: false,
      error: "authToken and baseUrl are required for Salesforce API",
    };
  }

  const url = `${baseUrl}/services/data/v56.0/sobjects/${objectType}/describe/`;

  try {
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return {
      success: true,
      schema: response.data.fields,
    };
  } catch (error) {
    console.error("Error retrieving Salesforce schema:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default fetchSalesforceSchemaByObject;
