import type {
  AuthParamsType,
  googleOauthCreateNewGoogleDocFunction,
  googleOauthCreateNewGoogleDocOutputType,
  googleOauthCreateNewGoogleDocParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { resolveContentFormat, contentToDocRequests } from "./utils/googleDocsMarkdown.js";

async function createGoogleDoc({
  authToken,
  title,
  folderId,
}: {
  authToken: string;
  title: string;
  folderId?: string;
}): Promise<{ documentId: string; documentUrl?: string }> {
  const headers = {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };

  if (folderId) {
    const response = await axiosClient.post(
      "https://www.googleapis.com/drive/v3/files",
      {
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      },
      {
        params: {
          fields: "id,webViewLink",
          supportsAllDrives: true,
        },
        headers,
      },
    );

    return {
      documentId: response.data.id,
      documentUrl: response.data.webViewLink,
    };
  }

  const response = await axiosClient.post(
    "https://docs.googleapis.com/v1/documents",
    { title },
    {
      headers,
    },
  );

  return {
    documentId: response.data.documentId,
  };
}

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
  const { title, content, folderId, usesHtml, contentFormat } = params;
  const baseApiUrl = "https://docs.googleapis.com/v1/documents";
  const resolvedContentFormat = resolveContentFormat({ contentFormat, usesHtml });

  const { documentId, documentUrl } = await createGoogleDoc({
    authToken: authParams.authToken,
    title,
    folderId,
  });

  // If content is provided, update the document body with the content
  if (content) {
    const requests = contentToDocRequests({ content, format: resolvedContentFormat });

    await axiosClient.post(
      `${baseApiUrl}/${documentId}:batchUpdate`,
      { requests },
      {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
          "Content-Type": "application/json",
        },
      },
    );
  }

  return {
    documentId,
    documentUrl: documentUrl ?? (documentId ? `https://docs.google.com/document/d/${documentId}/edit` : undefined),
  };
};

export default createNewGoogleDoc;
