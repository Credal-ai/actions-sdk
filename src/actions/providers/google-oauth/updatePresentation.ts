import type {
  AuthParamsType,
  googleOauthUpdatePresentationFunction,
  googleOauthUpdatePresentationOutputType,
  googleOauthUpdatePresentationParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

/**
 * Updates an existing Google Slides presentation using OAuth authentication with batch requests
 * https://developers.google.com/slides/api/reference/rest/v1/presentations/batchUpdate
 */
const updatePresentation: googleOauthUpdatePresentationFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthUpdatePresentationParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthUpdatePresentationOutputType> => {
  if (!authParams.authToken) {
    return {
      success: false,
      error: "authToken is required for Google Slides API",
    };
  }

  const { presentationId, requests } = params;
  const baseApiUrl = "https://slides.googleapis.com/v1/presentations";

  try {
    // If requests are provided, send them as a batch update
    if (requests && requests.length > 0) {
      const response = await axiosClient.post(
        `${baseApiUrl}/${presentationId}:batchUpdate`,
        {
          requests,
        },
        {
          headers: {
            Authorization: `Bearer ${authParams.authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status < 200 || response.status >= 300) {
        return {
          success: false,
          error: `${response.statusText}: ${JSON.stringify(response.data)}`,
        };
      }

      const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

      return {
        success: true,
        presentationUrl,
      };
    } else {
      return {
        success: false,
        error: "No requests provided",
      };
    }
  } catch (error) {
    console.error("Error updating presentation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updatePresentation;
