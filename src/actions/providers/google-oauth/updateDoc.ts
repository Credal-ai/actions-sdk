import axios from "axios";
import type {
  AuthParamsType,
  googleOauthUpdateDocFunction,
  googleOauthUpdateDocParamsType,
  googleOauthUpdateDocOutputType,
} from "../../autogen/types";

/**
 * Updates an existing Google Docs document using OAuth authentication with batch requests
 * https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/batchUpdate
 */
const updateDoc: googleOauthUpdateDocFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthUpdateDocParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthUpdateDocOutputType> => {
  if (!authParams.authToken) {
    return {
      success: false,
      documentId: params.documentId,
      error: "No auth token provided",
    };
  }

  const { documentId, requests } = params;
  const baseApiUrl = "https://docs.googleapis.com/v1/documents";

  try {
    // If requests are provided, send them as a batch update
    if (requests && requests.length > 0) {
      const response = await axios.post(
        `${baseApiUrl}/${documentId}:batchUpdate`,
        {
          requests,
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
    } else {
      return {
        success: false,
        error: "No requests provided",
      };
    }
  } catch (error) {
    console.error("Error updating document:", error);
    return {
      success: false,
      documentId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default updateDoc;
