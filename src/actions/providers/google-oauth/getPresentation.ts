import type {
  AuthParamsType,
  googleOauthGetPresentationFunction,
  googleOauthGetPresentationParamsType,
  googleOauthGetPresentationOutputType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { z } from "zod";

// Zod schemas for Google Slides API response structure
const TextRunSchema = z
  .object({
    content: z.string().optional(),
  })
  .passthrough();

const TextElementSchema = z
  .object({
    textRun: TextRunSchema.optional(),
  })
  .passthrough();

const TextSchema = z
  .object({
    textElements: z.array(TextElementSchema).optional(),
  })
  .passthrough();

const ShapeSchema = z
  .object({
    text: TextSchema.optional(),
  })
  .passthrough();

const PageElementSchema = z
  .object({
    objectId: z.string().optional(),
    shape: ShapeSchema.optional(),
  })
  .passthrough();

const SlideSchema = z
  .object({
    objectId: z.string().optional(),
    pageElements: z.array(PageElementSchema).optional(),
  })
  .passthrough();

const GoogleSlidesResponseSchema = z
  .object({
    title: z.string().optional(),
    slides: z.array(SlideSchema).optional(),
  })
  .passthrough();

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

    // Validate and parse the Google Slides API response
    const parsedData = GoogleSlidesResponseSchema.parse(response.data);

    const presentation = {
      title: parsedData.title,
      slides:
        parsedData.slides?.map(slide => ({
          objectId: slide.objectId,
          pageElements:
            slide.pageElements
              ?.map(element => ({
                objectId: element.objectId,
                text:
                  element.shape?.text?.textElements?.map(textElement => textElement.textRun?.content || "").join("") ||
                  "",
              }))
              .filter(element => element.text) || [],
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
