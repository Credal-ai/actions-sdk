import type {
  confluenceDataCenterCreatePageFunction,
  confluenceDataCenterCreatePageParamsType,
  confluenceDataCenterCreatePageOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getConfluenceApi } from "./helpers.js";

const confluenceDataCenterCreatePage: confluenceDataCenterCreatePageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceDataCenterCreatePageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceDataCenterCreatePageOutputType> => {
  const { spaceKey, title, content, parentId } = params;

  try {
    const { baseUrl, config } = getConfluenceApi(authParams);

    const payload: Record<string, unknown> = {
      type: "page",
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: "storage",
        },
      },
    };

    if (parentId) {
      payload.ancestors = [{ id: parentId }];
    }

    const response = await axiosClient.post(`${baseUrl}/content`, payload, config);

    const pageId: string | undefined = response.data?.id;
    const links = response.data?._links ?? {};
    const pageUrl: string | undefined = links.base && links.webui ? `${links.base}${links.webui}` : undefined;

    return {
      success: true,
      pageId,
      pageUrl,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while creating the Confluence Data Center page.",
    };
  }
};

export default confluenceDataCenterCreatePage;
