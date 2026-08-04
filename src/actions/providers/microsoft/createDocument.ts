import type {
  AuthParamsType,
  microsoftCreateDocumentFunction,
  microsoftCreateDocumentOutputType,
  microsoftCreateDocumentParamsType,
} from "../../autogen/types.js";
import { getGraphClient, validateAndSanitizeFileName } from "./utils.js";

const createDocument: microsoftCreateDocumentFunction = async ({
  params,
  authParams,
}: {
  params: microsoftCreateDocumentParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftCreateDocumentOutputType> => {
  const { folderId, name, content, siteId, driveId } = params;

  let client = undefined;
  try {
    client = await getGraphClient(authParams);
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  // Item IDs are scoped to a drive, so a driveId (when known) addresses the exact document
  // library; /sites/{siteId}/drive only ever reaches the site's default library
  const drivePath = driveId ? `/drives/${driveId}` : siteId ? `/sites/${siteId}/drive` : "/me/drive";
  const sanitizedFileName = validateAndSanitizeFileName(name);
  const endpoint = `${drivePath}/items/${folderId || "root"}:/${sanitizedFileName}:/content`;
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
