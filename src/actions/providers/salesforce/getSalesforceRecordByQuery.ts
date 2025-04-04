import {
    AuthParamsType,
    salesforceGetSalesforceRecordsByQueryFunction,
    salesforceGetSalesforceRecordsByQueryOutputType,
    salesforceGetSalesforceRecordsByQueryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getRecord: salesforceGetSalesforceRecordsByQueryFunction = async ({
    params,
    authParams,
}: {
    params: salesforceGetSalesforceRecordsByQueryParamsType;
    authParams: AuthParamsType;
}): Promise<salesforceGetSalesforceRecordsByQueryOutputType> => {
    const { authToken, baseUrl } = authParams;
    const { objectType, query } = params;

    if (!authToken || !baseUrl) {
        return {
            success: false,
            error: "authToken and baseUrl are required for Salesforce API",
        };
    }

    const url = `${baseUrl}/services/data/v56.0/sobjects/${objectType}/${recordId}`;

    try {
        const response = await axiosClient.get(url, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        return {
            success: true,
            record: response.data,
        };
    } catch (error) {
        console.error("Error retrieving Salesforce record:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};

export default getRecord;
