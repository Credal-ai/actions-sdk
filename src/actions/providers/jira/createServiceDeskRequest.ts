import type {
  AuthParamsType,
  jiraCreateServiceDeskRequestFunction,
  jiraCreateServiceDeskRequestOutputType,
  jiraCreateServiceDeskRequestParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const createServiceDeskRequest: jiraCreateServiceDeskRequestFunction = async ({
  params,
  authParams,
}: {
  params: jiraCreateServiceDeskRequestParamsType;
  authParams: AuthParamsType;
}): Promise<jiraCreateServiceDeskRequestOutputType> => {
  const { serviceDeskId, requestTypeId, summary, description, reporter } = params;
  const { authToken, cloudId } = authParams;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to get service desks");
  }

  const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/servicedeskapi/request`;

  try {
    const response = await axiosClient.post(
      baseUrl,
      {
        requestTypeId,
        serviceDeskId,
        // summary,
        // description,
        // reporter,
        requestFieldValues: {
          summary,
          description,
        },
        raiseOnBehalfOf: reporter,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    const webLink = response.data._links.web;
    const currentStatus = response.data.currentStatus.status;

    return {
      success: true,
      webLink,
      currentStatus,
      issueKey: response.data.issueKey,
    };
  } catch (error) {
    console.error("Error creating service desk request: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default createServiceDeskRequest;
