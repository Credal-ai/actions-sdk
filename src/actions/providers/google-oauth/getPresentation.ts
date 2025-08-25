import type {
  AuthParamsType,
  googleOauthGetPresentationFunction,
  googleOauthGetPresentationParamsType,
  googleOauthGetPresentationOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Gets a Google Slides presentation by ID using OAuth authentication
 */
const getPresentation: googleOauthGetPresentationFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthGetPresentationParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthGetPresentationOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { presentationId } = params;
  const baseApiUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}`;

  try {
    const response = await axiosClient.get(baseApiUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: response.statusText,
      };
    }

    const presentation = {
      title: response.data.title,
      slides:
        response.data.slides?.map((slide: any) => ({
          objectId: slide.objectId,
          pageElements:
            slide.pageElements
              ?.map((element: any) => ({
                objectId: element.objectId,
                text:
                  element.shape?.text?.textElements
                    ?.map((textElement: any) => textElement.textRun?.content || "")
                    .join("") || "",
              }))
              .filter((element: any) => element.text) || [],
        })) || [],
    };

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error("Error getting presentation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default getPresentation;
