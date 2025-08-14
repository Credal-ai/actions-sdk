import type {
  AuthParamsType,
  hubspotGetDealDetailsFunction,
  hubspotGetDealDetailsOutputType,
  hubspotGetDealDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getDealDetails: hubspotGetDealDetailsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetDealDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetDealDetailsOutputType> => {
  const { authToken } = authParams;
  const { dealId } = params;

  if (!authToken || !dealId) {
    return {
      success: false,
      error: "Both authToken and dealId are required to get deal details.",
    };
  }

  try {
    const requestedProperties = [
      "dealname",
      "amount",
      "dealstage",
      "pipeline",
      "dealtype",
      "closedate",
      "hubspot_owner_id",
      "description",
      "createdate",
      "hs_lastmodifieddate",
    ];
    const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${requestedProperties.join(",")}`;
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    const { id, properties, createdAt, updatedAt, archived } = response.data;
    const {
      dealname,
      amount,
      dealstage,
      pipeline,
      dealtype,
      closedate,
      description,
      hubspot_owner_id,
      hs_lastmodifieddate,
    } = properties;

    return {
      success: true,
      deal: {
        id,
        dealname,
        description,
        amount,
        dealstage,
        pipeline,
        dealtype,
        closedate,
        createdAt,
        updatedAt: hs_lastmodifieddate || updatedAt,
        ownerId: hubspot_owner_id,
        archived,
      },
    };
  } catch (error) {
    console.error("Error getting HubSpot deal details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getDealDetails;
