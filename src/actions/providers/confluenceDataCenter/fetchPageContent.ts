import type {
  confluenceDataCenterFetchPageContentFunction,
  confluenceDataCenterFetchPageContentParamsType,
  confluenceDataCenterFetchPageContentOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getConfluenceApi } from "./helpers.js";

const confluenceDataCenterFetchPageContent: confluenceDataCenterFetchPageContentFunction = async ({
  params,
  authParams,
}: {
  params: confluenceDataCenterFetchPageContentParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceDataCenterFetchPageContentOutputType> => {
  const { pageId } = params;

  try {
    const { baseUrl, config } = getConfluenceApi(authParams);
    const response = await axiosClient.get(`${baseUrl}/content/${pageId}?expand=body.storage,version`, config);

    const title = response.data.title;
    const content = response.data.body?.storage?.value || "";

    return {
      success: true,
      data: {
        pageId,
        title,
        content,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching the Confluence Data Center page content.",
    };
  }
};

export default confluenceDataCenterFetchPageContent;
