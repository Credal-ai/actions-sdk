import type {
  AuthParamsType,
  microsoftUpdateDocumentFunction,
  microsoftUpdateDocumentOutputType,
  microsoftUpdateDocumentParamsType,
} from "../../autogen/types.js";
import {
  fileNameHasDocxExtension,
  generateDocxFromPlainText,
  getDrivePath,
  getGraphClient,
  getUnsupportedOfficeExtension,
} from "./utils.js";

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
    const drivePath = getDrivePath({ driveId, siteId });

    // The target's filename decides how the content must be written: .docx is a
    // ZIP-of-XML container, so overwriting it with raw text would corrupt it.
    const itemMetadata = await client.api(`${drivePath}/items/${documentId}?$select=name`).get();
    const fileName: string = itemMetadata?.name ?? "";

    const unsupportedOfficeExtension = getUnsupportedOfficeExtension(fileName);
    if (unsupportedOfficeExtension) {
      return {
        success: false,
        error: `Cannot update "${unsupportedOfficeExtension}" files: this action writes the provided text and can only generate Word documents. Only .docx and plain-text files can be updated.`,
      };
    }

    const body = fileNameHasDocxExtension(fileName) ? await generateDocxFromPlainText(content) : content;

    const endpoint = `${drivePath}/items/${documentId}/content`;

    const response = await client.api(endpoint).put(body);

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
