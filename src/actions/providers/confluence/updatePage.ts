import { AxiosRequestConfig } from "axios";
import {
  confluenceUpdatePageFunction,
  confluenceUpdatePageParamsType,
  confluenceUpdatePageOutputType,
  AuthParamsType,
} from "../../../actions/autogen/types";
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

const confluenceUpdatePage: confluenceUpdatePageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceUpdatePageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceUpdatePageOutputType> => {
  const { pageId, username, content, title } = params;
  const { baseUrl, authToken } = authParams;

  const config = getConfluenceRequestConfig(baseUrl!, username, authToken!);

  // Get current version number
  const response = await axiosClient.get(`/api/v2/pages/${pageId}`, config);
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

  await axiosClient.put(`/api/v2/pages/${pageId}`, payload, config);
};

export default confluenceUpdatePage;
