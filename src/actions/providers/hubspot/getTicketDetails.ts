import type {
  AuthParamsType,
  hubspotGetTicketDetailsFunction,
  hubspotGetTicketDetailsOutputType,
  hubspotGetTicketDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getTicketDetails: hubspotGetTicketDetailsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetTicketDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetTicketDetailsOutputType> => {
  const { authToken } = authParams;
  const { ticketId } = params;

  if (!authToken || !ticketId) {
    return {
      success: false,
      error: "Both authToken and ticketId are required to get ticket details.",
    };
  }

  try {
    const requestedProperties = [
      "subject",
      "content",
      "hs_pipeline",
      "hs_pipeline_stage",
      "hs_ticket_priority",
      "hubspot_owner_id",
      "createdate",
      "hs_lastmodifieddate",
    ];
    const url = `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=${requestedProperties.join(",")}`;
    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    const { id, properties, createdAt, updatedAt, archived } = response.data;
    const {
      subject,
      content,
      hs_pipeline,
      hs_pipeline_stage,
      hs_ticket_priority,
      hubspot_owner_id,
      hs_lastmodifieddate,
    } = properties;
    return {
      success: true,
      ticket: {
        id,
        subject,
        content,
        pipeline: hs_pipeline,
        status: hs_pipeline_stage,
        priority: hs_ticket_priority,
        createdAt,
        updatedAt: hs_lastmodifieddate || updatedAt,
        ownerId: hubspot_owner_id,
        archived,
      },
    };
  } catch (error) {
    console.error("Error getting HubSpot ticket details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getTicketDetails;
