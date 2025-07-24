import type {
  AuthParamsType,
  hubspotGetCompanyDetailsFunction,
  hubspotGetCompanyDetailsOutputType,
  hubspotGetCompanyDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getCompanyDetails: hubspotGetCompanyDetailsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetCompanyDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetCompanyDetailsOutputType> => {
  const { authToken } = authParams;
  const { companyId } = params;

  if (!authToken || !companyId) {
    return {
      success: false,
      error: "Both authToken and companyId are required to get company details.",
    };
  }

  try {
    const requestedProperties = [
      "name",
      "domain",
      "industry",
      "phone",
      "address",
      "city",
      "state",
      "zip",
      "country",
      "website",
      "createdate",
      "lastmodifieddate",
      "archived",
    ];

    const url = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=${requestedProperties.join(",")}`;

    const response = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const {
      id,
      properties,
      createdAt,
      updatedAt,
      archived,
    }: {
      id: string;
      properties: Record<string, string>;
      createdAt: string;
      updatedAt: string;
      archived: boolean;
    } = response.data;

    const { name, domain, industry, phone, address, city, state, zip, country, website, createdate, lastmodifieddate } =
      properties;

    return {
      success: true,
      company: {
        id,
        name,
        domain,
        industry,
        phone,
        address,
        city,
        state,
        zip,
        country,
        website,
        createdAt: createdate || createdAt,
        updatedAt: lastmodifieddate || updatedAt,
        archived,
      },
    };
  } catch (error) {
    console.error("Error getting HubSpot company details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getCompanyDetails;
