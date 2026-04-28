import type {
  confluenceDataCenterOverwritePageFunction,
  confluenceDataCenterOverwritePageParamsType,
  confluenceDataCenterOverwritePageOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getConfluenceApi } from "./helpers.js";

const confluenceDataCenterOverwritePage: confluenceDataCenterOverwritePageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceDataCenterOverwritePageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceDataCenterOverwritePageOutputType> => {
  const { pageId, content, title } = params;
  const { baseUrl, config } = getConfluenceApi(authParams);

  try {
    const response = await axiosClient.get(
      `${baseUrl}/content/${pageId}?expand=version`,
      config,
    );
    const currVersion = response.data.version.number;

    const payload = {
      id: pageId,
      type: "page",
      title,
      body: {
        storage: {
          value: content,
          representation: "storage",
        },
      },
      version: {
        number: currVersion + 1,
      },
    };

    await axiosClient.put(`${baseUrl}/content/${pageId}`, payload, config);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while updating the Confluence Data Center page.",
    };
  }
};

export default confluenceDataCenterOverwritePage;
