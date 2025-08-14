import type {
  AuthParamsType,
  jiraGetServiceDesksFunction,
  jiraGetServiceDesksOutputType,
  jiraGetServiceDesksParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const getServiceDesks: jiraGetServiceDesksFunction = async ({
  authParams,
}: {
  params: jiraGetServiceDesksParamsType;
  authParams: AuthParamsType;
}): Promise<jiraGetServiceDesksOutputType> => {
  const { authToken, cloudId } = authParams;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to get service desks");
  }

  const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/servicedeskapi/servicedesk`;

  try {
    const allServiceDesks = [];
    let start = 0;
    const limit = 50; // Set a reasonable limit per request
    let isLastPage = false;

    // Keep fetching pages until we reach the last page
    while (!isLastPage) {
      const apiUrl = `${baseUrl}?start=${start}&limit=${limit}`;

      const response = await axiosClient.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const { values, isLastPage: lastPage, size } = response.data;

      const serviceDesks = [];
      for (const serviceDesk of values) {
        // Get request types
        const { requestTypes } = await getServiceDeskRequestTypes({
          authParams,
          serviceDeskId: serviceDesk.id,
        });

        serviceDesks.push({
          ...serviceDesk,
          requestTypes,
        });
      }

      // Add current page's service desks to our collection
      allServiceDesks.push(...serviceDesks);

      // Update pagination variables
      isLastPage = lastPage;
      start += size; // Move to next page
    }

    return {
      success: true,
      serviceDesks: allServiceDesks,
    };
  } catch (error) {
    console.error("Error retrieving service desks: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

async function getServiceDeskRequestTypes(args: { authParams: AuthParamsType; serviceDeskId: string }): Promise<{
  requestTypes: {
    id: string;
    name: string;
    description: string;
    issueTypeId: string;
    portalId: string;
  }[];
}> {
  const { authParams, serviceDeskId } = args;
  const { authToken, cloudId } = authParams;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to get service desks");
  }

  const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`;

  try {
    const allRequestTypes = [];
    let start = 0;
    const limit = 50; // Set a reasonable limit per request
    let isLastPage = false;

    // Keep fetching pages until we reach the last page
    while (!isLastPage) {
      const apiUrl = `${baseUrl}?start=${start}&limit=${limit}`;

      const response = await axiosClient.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const { values, isLastPage: lastPage, size } = response.data;

      // Add current page's service desks to our collection
      allRequestTypes.push(...values);

      // Update pagination variables
      isLastPage = lastPage;
      start += size; // Move to next page
    }

    return {
      requestTypes: allRequestTypes,
    };
  } catch (error) {
    console.error("Error retrieving service desks: ", error);
    return {
      requestTypes: [],
    };
  }
}

export default getServiceDesks;
