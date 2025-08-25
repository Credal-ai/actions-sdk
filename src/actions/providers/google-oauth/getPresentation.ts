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
const TextStyleSchema = z
  .object({
    fontSize: z
      .object({
        magnitude: z.number().optional(),
        unit: z.string().optional(),
      })
      .optional(),
    foregroundColor: z
      .object({
        opaqueColor: z
          .object({
            rgbColor: z
              .object({
                red: z.number().optional(),
                green: z.number().optional(),
                blue: z.number().optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .optional(),
    fontFamily: z.string().optional(),
    bold: z.boolean().optional(),
  })
  .passthrough();

const TextRunSchema = z
  .object({
    content: z.string().optional(),
    style: TextStyleSchema.optional(),
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
 * Formats text styling information into a concatenated string
 */
const formatStyling = (textStyle?: z.infer<typeof TextStyleSchema>): string => {
  if (!textStyle) return "";

  const parts: string[] = [];
  if (textStyle.fontSize?.magnitude && textStyle.fontSize?.unit) {
    parts.push(`size: ${textStyle.fontSize.magnitude}${textStyle.fontSize.unit}`);
  }

  if (textStyle.foregroundColor?.opaqueColor?.rgbColor) {
    const { red = 0, green = 0, blue = 0 } = textStyle.foregroundColor.opaqueColor.rgbColor;
    const hexColor =
      "#" +
      [red, green, blue]
        .map(c =>
          Math.round(c * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    parts.push(`color: ${hexColor}`);
  }

  if (textStyle.fontFamily) {
    parts.push(`family: ${textStyle.fontFamily}`);
  }

  if (textStyle.bold) {
    parts.push(`bold`);
  }

  return parts.join(", ");
};

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
              ?.flatMap(element => {
                const textElements = element.shape?.text?.textElements || [];
                return textElements
                  .map(textElement => {
                    const content = textElement.textRun?.content || "";
                    const styling = formatStyling(textElement.textRun?.style);

                    return {
                      objectId: `${element.objectId}`,
                      text: content,
                      styling,
                    };
                  })
                  .filter(textRun => textRun.text.trim());
              })
              .filter(Boolean) || [],
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
