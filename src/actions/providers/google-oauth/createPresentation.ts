import type {
  AuthParamsType,
  googleOauthCreatePresentationFunction,
  googleOauthCreatePresentationParamsType,
  googleOauthCreatePresentationOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

/**
 * Creates a new Google Slides presentation using OAuth authentication
 */
const createPresentation: googleOauthCreatePresentationFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCreatePresentationParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCreatePresentationOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { title, pageSize } = params;
  const baseApiUrl = "https://slides.googleapis.com/v1/presentations";

  const requestBody = {
    title,
    ...(pageSize && { pageSize }),
  };

  try {
    const response = await axiosClient.post(baseApiUrl, requestBody, {
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

    const { presentationId } = response.data;
    const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

    return {
      success: true,
      presentationId,
      presentationUrl,
    };
  } catch (error) {
    console.error("Error creating presentation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default createPresentation;
