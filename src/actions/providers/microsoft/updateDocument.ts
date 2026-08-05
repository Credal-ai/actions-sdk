import type {
  AuthParamsType,
  microsoftUpdateDocumentFunction,
  microsoftUpdateDocumentOutputType,
  microsoftUpdateDocumentParamsType,
} from "../../autogen/types.js";
import { getDrivePath, getGraphClient } from "./utils.js";

const updateDocument: microsoftUpdateDocumentFunction = async ({
  params,
  authParams,
}: {
  params: microsoftUpdateDocumentParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftUpdateDocumentOutputType> => {
  const { documentId, content, siteId, driveId } = params;

  let client = undefined;
  try {
    client = await getGraphClient(authParams);
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    const endpoint = `${getDrivePath({ driveId, siteId })}/items/${documentId}/content`;

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
