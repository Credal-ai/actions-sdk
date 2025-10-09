import type {
  AuthParamsType,
  hubspotGetCompaniesFunction,
  hubspotGetCompaniesOutputType,
  hubspotGetCompaniesParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getCompanies: hubspotGetCompaniesFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetCompaniesParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetCompaniesOutputType> => {
  const { authToken } = authParams;
  const { query, limit = 100 } = params;

  if (!authToken) {
    return {
      success: false,
      error: "authToken is required for HubSpot API",
    };
  }

  try {
    const url = "https://api.hubapi.com/crm/v3/objects/companies/search";
    const maxLimit = Math.min(limit, 500);
    const pageSize = 100;
    const allCompanies: Array<{ id: string; name?: string; domain?: string; createdAt?: string }> = [];
    let after: string | undefined;
    let hasMore = true;

    while (hasMore && allCompanies.length < maxLimit) {
      const requestBody: {
        query?: string;
        properties?: string[];
        limit?: number;
        after?: string;
      } = {
        properties: ["name", "domain", "createdate"],
        limit: Math.min(pageSize, maxLimit - allCompanies.length),
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

      allCompanies.push(
        ...results.map(({ id, properties }: { id: string; properties: Record<string, string> }) => {
          const { name, domain, createdate } = properties;
          return {
            id,
            name,
            domain,
            createdAt: createdate,
          };
        }),
      );

      if (paging?.next?.after && allCompanies.length < maxLimit) {
        after = paging.next.after;
      } else {
        hasMore = false;
      }
    }

    return {
      success: true,
      results: allCompanies.map(company => ({
        name: company.name || "Unknown Company",
        url: `https://app.hubspot.com/companies/${company.id}`,
        contents: company,
      })),
    };
  } catch (error) {
    console.error("Error searching HubSpot companies:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getCompanies;
