import type { AxiosRequestConfig } from "axios";
import type {
  confluenceOverwritePageFunction,
  confluenceOverwritePageParamsType,
  confluenceOverwritePageOutputType,
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

const confluenceOverwritePage: confluenceOverwritePageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceOverwritePageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceOverwritePageOutputType> => {
  const { pageId, content, title } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error("Missing required authentication parameters");
  }

  const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources");
  const cloudId = cloudDetails.data[0].id;
  const baseUrl = `https://api.atlassian.com/ex/confluence/${cloudId}/api/v2`;

  const config = getConfluenceRequestConfig(baseUrl, authToken);

  // Get current page content and version number
  const response = await axiosClient.get(`/pages/${pageId}?body-format=storage`, config);
  const currVersion = response.data.version.number;

  const payload = {
    id: pageId,
    status: "current",
    title,
    body: {
      representation: "storage",
      value: content,
    },
    version: {
      number: currVersion + 1,
    },
  };

  await axiosClient.put(`/pages/${pageId}`, payload, config);
};

export default confluenceOverwritePage;
