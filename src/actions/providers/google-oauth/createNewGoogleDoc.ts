import type {
  AuthParamsType,
  googleOauthCreateNewGoogleDocFunction,
  googleOauthCreateNewGoogleDocOutputType,
  googleOauthCreateNewGoogleDocParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

/**
 * Creates a new Google Doc document using OAuth authentication
 */
const createNewGoogleDoc: googleOauthCreateNewGoogleDocFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthCreateNewGoogleDocParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthCreateNewGoogleDocOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const { title, content } = params;
  const baseApiUrl = "https://docs.googleapis.com/v1/documents";

  // Create the document with the provided title
  const response = await axiosClient.post(
    baseApiUrl,
    { title },
    {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  // If content is provided, update the document body with the content
  if (content) {
    const documentId = response.data.documentId;

    // Add the description to the document content
    await axiosClient.post(
      `${baseApiUrl}/${documentId}:batchUpdate`,
      {
        requests: [
          {
            insertText: {
              location: {
                index: 1, // Insert at the beginning of the document
              },
              text: content,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
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
};

export default createNewGoogleDoc;
