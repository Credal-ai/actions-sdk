import type { AxiosRequestConfig } from "axios";
import type {
  confluenceFetchPageContentFunction,
  confluenceFetchPageContentParamsType,
  confluenceFetchPageContentOutputType,
  AuthParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

function getConfluenceRequestConfig(baseUrl: string, username: string, apiToken: string): AxiosRequestConfig {
  return {
    baseURL: baseUrl,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${username}:${apiToken}`).toString("base64")}`,
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
  const { baseUrl, authToken, username } = authParams;

  if (!baseUrl || !authToken || !username) {
    throw new Error("Missing required authentication parameters");
  }

  const config = getConfluenceRequestConfig(baseUrl, username, authToken);

  // Get page content and metadata
  const response = await axiosClient.get(`/api/v2/pages/${pageId}?body-format=storage`, config);

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
