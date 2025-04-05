import {
  AuthParamsType,
  microsoftGetDocumentFunction,
  microsoftGetDocumentOutputType,
  microsoftGetDocumentParamsType,
} from "../../autogen/types";
import { getGraphClient } from "./utils";

const getDocument: microsoftGetDocumentFunction = async ({
  params,
  authParams,
}: {
  params: microsoftGetDocumentParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftGetDocumentOutputType> => {
  const { siteId, documentId } = params;

  let client;
  try {
    client = await getGraphClient(authParams, "Files.ReadWrite Sites.ReadWrite.All");
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    // Construct the API endpoint
    const endpoint = siteId
      ? `/sites/${siteId}/drive/items/${documentId}/content`
      : `/me/drive/items/${documentId}/content`;

    // Fetch the document content
    const response = await client.api(endpoint).get();

    return {
      success: true,
      content: response, // Assuming the response contains the document content
    };
  } catch (error) {
    console.error("Error retrieving document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default getDocument;
