import type {
  AuthParamsType,
  hubspotGetContactDetailsFunction,
  hubspotGetContactDetailsOutputType,
  hubspotGetContactDetailsParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getContactDetails: hubspotGetContactDetailsFunction = async ({
  params,
  authParams,
}: {
  params: hubspotGetContactDetailsParamsType;
  authParams: AuthParamsType;
}): Promise<hubspotGetContactDetailsOutputType> => {
  const { authToken } = authParams;
  const { contactId } = params;

  if (!authToken || !contactId) {
    return {
      success: false,
      error: "Both authToken and contactId are required to get contact details.",
    };
  }

  try {
    const requestedProperties = [
      "email",
      "firstname",
      "lastname",
      "company",
      "phone",
      "address",
      "city",
      "state",
      "zip",
      "country",
      "hs_lead_status",
      "lifecyclestage",
    ];

    const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${requestedProperties.join(",")}`;

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

    const {
      email,
      firstname,
      lastname,
      company,
      phone,
      address,
      city,
      state,
      zip,
      country,
      hs_lead_status,
      lifecyclestage,
    } = properties;

    return {
      success: true,
      contact: {
        id,
        email,
        firstname,
        lastname,
        company,
        phone,
        address,
        city,
        state,
        zip,
        country,
        lifecyclestage,
        leadstatus: hs_lead_status,
        createdAt,
        updatedAt,
        archived,
      },
    };
  } catch (error) {
    console.error("Error getting HubSpot contact details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export default getContactDetails;
