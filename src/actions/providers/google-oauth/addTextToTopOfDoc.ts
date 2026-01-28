import axios from "axios";
import type {
  AuthParamsType,
  googleOauthAddTextToTopOfDocFunction,
  googleOauthAddTextToTopOfDocParamsType,
  googleOauthAddTextToTopOfDocOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const addTextToTopOfDoc: googleOauthAddTextToTopOfDocFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthAddTextToTopOfDocParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthAddTextToTopOfDocOutputType> => {
  if (!authParams.authToken) {
    return {
      success: false,
      documentId: params.documentId,
      error: MISSING_AUTH_TOKEN,
    };
  }

  const { documentId, text } = params;
  const baseApiUrl = "https://docs.googleapis.com/v1/documents";

  try {
    const response = await axios.post(
      `${baseApiUrl}/${documentId}:batchUpdate`,
      {
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: text + "\n",
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
      },
    );

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: `${response.statusText}: ${JSON.stringify(response.data)}`,
      };
    }

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return {
      success: true,
      documentId,
      documentUrl,
    };
  } catch (error) {
    console.error("Error appending text to top of document:", error);
    return {
      success: false,
      documentId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default addTextToTopOfDoc;
