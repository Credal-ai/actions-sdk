import type {
  confluenceFetchPageContentFunction,
  confluenceFetchPageContentParamsType,
  confluenceFetchPageContentOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { getConfluenceRequestConfig } from "./helpers.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const confluenceFetchPageContent: confluenceFetchPageContentFunction = async ({
  params,
  authParams,
}: {
  params: confluenceFetchPageContentParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceFetchPageContentOutputType> => {
  const { pageId } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const cloudId = cloudDetails.data[0].id;
  const baseUrl = `https://api.atlassian.com/ex/confluence/${cloudId}/api/v2`;

  const config = getConfluenceRequestConfig(baseUrl, authToken);

  // Get page content and metadata
  const response = await axiosClient.get(`/pages/${pageId}?body-format=storage`, config);

  // Extract needed data from response
  const title = response.data.title;
  const content = response.data.body?.storage?.value || "";

  return {
    pageId,
    title,
    content,
  };
};

export default confluenceFetchPageContent;
