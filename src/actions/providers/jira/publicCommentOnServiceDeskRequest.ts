import type {
  AuthParamsType,
  jiraPublicCommentOnServiceDeskRequestFunction,
  jiraPublicCommentOnServiceDeskRequestOutputType,
  jiraPublicCommentOnServiceDeskRequestParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

const publicCommentOnServiceDeskRequest: jiraPublicCommentOnServiceDeskRequestFunction = async ({
  params,
  authParams,
}: {
  params: jiraPublicCommentOnServiceDeskRequestParamsType;
  authParams: AuthParamsType;
}): Promise<jiraPublicCommentOnServiceDeskRequestOutputType> => {
  const { issueId, comment } = params;
  const { authToken, cloudId } = authParams;

  if (!cloudId || !authToken) {
    throw new Error("Valid Cloud ID and auth token are required to get service desks");
  }

  const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/servicedeskapi/request/${issueId}/comment`;

  try {
    const response = await axiosClient.post(
      baseUrl,
      {
        body: comment,
        public: true,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    const webLink = response.data._links.self;

    return {
      success: true,
      commentUrl: webLink,
    };
  } catch (error) {
    console.error("Error creating service desk request: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default publicCommentOnServiceDeskRequest;
