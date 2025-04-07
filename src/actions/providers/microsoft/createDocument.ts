import { microsoftCreateDocumentDefinition } from "../../autogen/templates";
import type {
  AuthParamsType,
  microsoftCreateDocumentFunction,
  microsoftCreateDocumentOutputType,
  microsoftCreateDocumentParamsType,
} from "../../autogen/types";
import { getGraphClient, validateAndSanitizeFileName } from "./utils";

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

  const apiEndpointPrefix = siteId ? `/sites/${siteId}` : "/me";
  const sanitizedFileName = validateAndSanitizeFileName(name);
  const endpoint = `${apiEndpointPrefix}/drive/items/${folderId || "root"}:/${sanitizedFileName}:/content`;
  try {
    // Create or update the document
    const response = await client.api(endpoint).put(content);
    return {
      success: true,
      documentId: response.id,
      documentUrl: response.webUrl,
      fileName: response.name,
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
