import { AxiosRequestConfig } from "axios";
import {
  confluenceAddToPageFunction,
  confluenceAddToPageParamsType,
  confluenceAddToPageOutputType,
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

const confluenceAddToPage: confluenceAddToPageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceAddToPageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceAddToPageOutputType> => {
  const { pageId, content, title } = params;
  const { baseUrl, authToken, username } = authParams;

  if (!baseUrl || !authToken || !username) {
    throw new Error("Missing required authentication parameters");
  }
  const config = getConfluenceRequestConfig(baseUrl, username, authToken);

  // Get current page content and version number
  const response = await axiosClient.get(`/api/v2/pages/${pageId}?body-format=storage`, config);
  const currVersion = response.data.version.number;
  const currentContent = response.data.body?.storage?.value || "";

  // Combine new content with existing content (new content on top)
  const combinedContent = currentContent + content;

  const payload = {
    id: pageId,
    status: "current",
    title,
    body: {
      representation: "storage",
      value: combinedContent,
    },
    version: {
      number: currVersion + 1,
    },
  };

  await axiosClient.put(`/api/v2/pages/${pageId}`, payload, config);
};

export default confluenceAddToPage;
