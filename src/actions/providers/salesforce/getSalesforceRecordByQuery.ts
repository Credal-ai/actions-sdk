import {
    AuthParamsType,
    salesforceGetSalesforceRecordsByQueryFunction,
    salesforceGetSalesforceRecordsByQueryOutputType,
    salesforceGetSalesforceRecordsByQueryParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getSalesforceRecordByQuery: salesforceGetSalesforceRecordsByQueryFunction = async ({
    params,
    authParams,
}: {
    params: salesforceGetSalesforceRecordsByQueryParamsType;
    authParams: AuthParamsType;
}): Promise<salesforceGetSalesforceRecordsByQueryOutputType> => {
    const { authToken, baseUrl } = authParams;
    const { query, limit } = params;

    if (!authToken || !baseUrl) {
        return {
            success: false,
            error: "authToken and baseUrl are required for Salesforce API",
        };
    }

    const url = `${baseUrl}/services/data/v56.0/query/?q=${encodeURIComponent(query + " LIMIT " + (limit != undefined && limit <= 2000 ? limit : 2000))}`;

    try {
        const response = await axiosClient.get(url, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        return {
            success: true,
            records: response.data,
        };
    } catch (error) {
        console.error("Error retrieving Salesforce record:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};

export default getSalesforceRecordByQuery;
