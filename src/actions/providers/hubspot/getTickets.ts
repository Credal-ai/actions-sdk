import type {
  AuthParamsType,
  hubspotGetTicketsFunction,
  hubspotGetTicketsOutputType,
  hubspotGetTicketsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getTickets: hubspotGetTicketsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetTicketsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetTicketsOutputType> => {
  const { authToken } = authParams;
  const { query, limit = 100 } = params;

  if (!authToken) {
    return {
      success: false,
      error: "authToken is required for HubSpot API",
    };
  }

  try {
    const url = "https://api.hubapi.com/crm/v3/objects/tickets/search";
    const properties = ["subject", "content", "hs_pipeline_stage"];
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
    const tickets = (response.data.results || []).map(
      (ticket: { id: string; properties: { subject?: string; hs_pipeline_stage?: string }; createdAt: string }) => {
        const { id, properties, createdAt } = ticket;
        const { subject, hs_pipeline_stage } = properties || {};
        return {
          id,
          subject,
          status: hs_pipeline_stage,
          createdAt,
        };
      },
    );
    return {
      success: true,
      results: tickets.map((ticket: { subject?: string; id: string }) => ({
        name: ticket.subject || "Unknown Ticket",
        url: `https://app.hubspot.com/tickets/${ticket.id}`,
        contents: ticket,
      })),
    };
  } catch (error) {
    console.error("Error getting HubSpot tickets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getTickets;
