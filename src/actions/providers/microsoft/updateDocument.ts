import { microsoftUpdateDocumentDefinition } from "../../autogen/templates";
import type {
  AuthParamsType,
  microsoftUpdateDocumentFunction,
  microsoftUpdateDocumentOutputType,
  microsoftUpdateDocumentParamsType,
} from "../../autogen/types";
import { getGraphClient } from "./utils";

const updateDocument: microsoftUpdateDocumentFunction = async ({
  params,
  authParams,
}: {
  params: microsoftUpdateDocumentParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftUpdateDocumentOutputType> => {
  const { documentId, content, siteId } = params;

  let client = undefined;
  try {
    client = await getGraphClient(authParams, microsoftUpdateDocumentDefinition.scopes.join(" "));
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    // Determine the endpoint based on whether siteId is provided
    const endpoint = siteId
      ? `/sites/${siteId}/drive/items/${documentId}/content`
      : `/me/drive/items/${documentId}/content`;

    const response = await client.api(endpoint).put(content);

    return {
      success: true,
      documentUrl: response.webUrl,
    };
  } catch (error) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default updateDocument;
