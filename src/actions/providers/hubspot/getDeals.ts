import type {
  AuthParamsType,
  hubspotGetDealsFunction,
  hubspotGetDealsOutputType,
  hubspotGetDealsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getDeals: hubspotGetDealsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetDealsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetDealsOutputType> => {
  const { authToken } = authParams;
  const { query, limit = 100 } = params;

  if (!authToken) {
    return {
      success: false,
      error: "authToken is required for HubSpot API",
    };
  }

  try {
    const url = "https://api.hubapi.com/crm/v3/objects/deals/search";
    const properties = ["dealname", "amount", "dealstage"];
    const requestBody: {
      query?: string;
      properties?: string[];
      limit?: number;
    } = {
      properties,
      limit,
    };
    if (query) {
      requestBody.query = query;
    }
    const response = await axiosClient.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    const deals = (response.data.results || []).map(
      (deal: {
        id: string;
        properties: { dealname?: string; amount?: string; dealstage?: string };
        createdAt: string;
      }) => {
        const { id, properties, createdAt } = deal;
        const { dealname, amount, dealstage } = properties || {};
        return {
          id,
          dealname,
          amount,
          dealstage,
          createdAt,
        };
      },
    );
    return {
      success: true,
      results: deals.map((deal: { dealname?: string; id: string }) => ({
        name: deal.dealname || "Unknown Deal",
        url: `https://app.hubspot.com/deals/${deal.id}`,
        contents: deal,
      })),
    };
  } catch (error) {
    console.error("Error getting HubSpot deals:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getDeals;
