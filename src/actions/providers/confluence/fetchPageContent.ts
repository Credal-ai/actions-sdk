import type { AxiosRequestConfig } from "axios";
import type {
  confluenceFetchPageContentFunction,
  confluenceFetchPageContentParamsType,
  confluenceFetchPageContentOutputType,
  AuthParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

function getConfluenceRequestConfig(baseUrl: string, authToken: string): AxiosRequestConfig {
  return {
    baseURL: baseUrl,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
}

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
    throw new Error("Missing required authentication parameters");
  }

  const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources");
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
