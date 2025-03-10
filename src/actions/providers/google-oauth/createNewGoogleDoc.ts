import axios from "axios";
import {
  AuthParamsType,
  google_oauthCreateNewGoogleDocFunction,
  google_oauthCreateNewGoogleDocOutputType,
  google_oauthCreateNewGoogleDocParamsType,
} from "../../autogen/types";

/**
 * Creates a new Google Doc document using OAuth authentication
 */
const createNewGoogleDoc: google_oauthCreateNewGoogleDocFunction = async ({
  params,
  authParams,
}: {
  params: google_oauthCreateNewGoogleDocParamsType;
  authParams: AuthParamsType;
}): Promise<google_oauthCreateNewGoogleDocOutputType> => {
  if (!authParams.accessToken) {
    throw new Error("accessToken is required for Google Docs API");
  }

  try {
    const { title, description } = params;
    const baseApiUrl = "https://docs.googleapis.com/v1/documents";

    // Create the document with the provided title
    const response = await axios.post(
      baseApiUrl,
      { title },
      {
        headers: {
          Authorization: `Bearer ${authParams.accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    // If description is provided, update the document body with the description
    if (description) {
      const documentId = response.data.documentId;

      // Add the description to the document content
      await axios.post(
        `${baseApiUrl}/${documentId}:batchUpdate`,
        {
          requests: [
            {
              insertText: {
                location: {
                  index: 1, // Insert at the beginning of the document
                },
                text: description,
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${authParams.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return {
      documentId: response.data.documentId,
      documentUrl: response.data.documentId
        ? `https://docs.google.com/document/d/${response.data.documentId}/edit`
        : undefined,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Google Docs API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
};

export default createNewGoogleDoc;
