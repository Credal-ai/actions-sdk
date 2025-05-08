import type {
  confluenceOverwritePageFunction,
  confluenceOverwritePageParamsType,
  confluenceOverwritePageOutputType,
  AuthParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
import { getConfluenceRequestConfig } from "./helpers";

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
