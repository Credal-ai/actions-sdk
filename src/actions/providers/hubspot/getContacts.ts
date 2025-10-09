import type {
  AuthParamsType,
  hubspotGetContactsFunction,
  hubspotGetContactsOutputType,
  hubspotGetContactsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getContacts: hubspotGetContactsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetContactsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetContactsOutputType> => {
  const { authToken } = authParams;
  const { query, limit = 100 } = params;

  if (!authToken) {
    return {
      success: false,
      error: "authToken is required for HubSpot API",
    };
  }

  try {
    const url = "https://api.hubapi.com/crm/v3/objects/contacts/search";
    const maxLimit = Math.min(limit, 500); // Cap at 500 results
    const pageSize = 100; // HubSpot max per request
    const allContacts: Array<{
      id: string;
      email?: string;
      firstname?: string;
      lastname?: string;
      createdate?: string;
    }> = [];
    let after: string | undefined;
    let hasMore = true;

    while (hasMore && allContacts.length < maxLimit) {
      const requestBody: {
        query?: string;
        properties?: string[];
        limit?: number;
        after?: string;
      } = {
        properties: ["email", "firstname", "lastname", "createdate"],
        limit: Math.min(pageSize, maxLimit - allContacts.length),
      };

      if (query) {
        requestBody.query = query;
      }

      if (after) {
        requestBody.after = after;
      }

      const response = await axiosClient.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const { results, paging } = response.data;

      allContacts.push(
        ...results.map(({ id, properties }: { id: string; properties: Record<string, string> }) => {
          const { email, firstname, lastname, createdate } = properties;
          return {
            id,
            email,
            firstname,
            lastname,
            createdate,
          };
        }),
      );

      if (paging?.next?.after && allContacts.length < maxLimit) {
        after = paging.next.after;
      } else {
        hasMore = false;
      }
    }

    return {
      success: true,
      results: allContacts.map(contact => ({
        name: `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || contact.email || "Unknown Contact",
        url: `https://app.hubspot.com/contacts/${contact.id}`,
        contents: contact,
      })),
    };
  } catch (error) {
    console.error("Error searching HubSpot contacts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getContacts;
