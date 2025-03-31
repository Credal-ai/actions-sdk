import { microsoftCreateDocumentDefinition } from "../../autogen/templates";
import {
  AuthParamsType,
  microsoftCreateDocumentFunction,
  microsoftCreateDocumentOutputType,
  microsoftCreateDocumentParamsType,
} from "../../autogen/types";
import { getGraphClient } from "./utils";

const createDocument: microsoftCreateDocumentFunction = async ({
  params,
  authParams,
}: {
  params: microsoftCreateDocumentParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftCreateDocumentOutputType> => {
  const { folderId, name, content, siteId } = params;

  let client = undefined;
  try {
    client = await getGraphClient(authParams, microsoftCreateDocumentDefinition.scopes.join(" "));
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    // Create or update the document
    let endpoint;
    if (siteId) {
      endpoint = folderId
        ? `/sites/${siteId}/drive/items/${folderId}:/${name}:/content`
        : `/sites/${siteId}/drive/root:/${name}:/content`;
    } else {
      endpoint = folderId ? `/me/drive/items/${folderId}:/${name}:/content` : `/me/drive/root:/${name}:/content`;
    }

    const response = await client.api(endpoint).put(content);

    return {
      success: true,
      documentId: response.id,
      documentUrl: response.webUrl,
    };
  } catch (error) {
    console.error("Error creating or updating document:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default createDocument;
