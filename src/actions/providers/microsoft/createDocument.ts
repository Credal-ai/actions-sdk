import type {
  AuthParamsType,
  microsoftCreateDocumentFunction,
  microsoftCreateDocumentOutputType,
  microsoftCreateDocumentParamsType,
} from "../../autogen/types.js";
import {
  fileNameHasDocxExtension,
  generateDocxFromPlainText,
  getDrivePath,
  getGraphClient,
  getUnsupportedOfficeExtension,
  validateAndSanitizeFileName,
} from "./utils.js";

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

  const sanitizedFileName = validateAndSanitizeFileName(name);

  const unsupportedOfficeExtension = getUnsupportedOfficeExtension(sanitizedFileName);
  if (unsupportedOfficeExtension) {
    return {
      success: false,
      error: `Cannot create "${unsupportedOfficeExtension}" files: this action writes the provided text and can only generate Word documents. Use a .docx extension for a Word document, or a plain-text extension like .txt.`,
    };
  }

  const endpoint = `${getDrivePath({ driveId, siteId })}/items/${folderId || "root"}:/${sanitizedFileName}:/content`;
  try {
    // .docx is a ZIP-of-XML container, so the text must be converted into real OOXML
    // bytes; writing it directly would produce a file Word cannot open.
    const body = fileNameHasDocxExtension(sanitizedFileName) ? await generateDocxFromPlainText(content) : content;
    // Create or update the document
    const response = await client.api(endpoint).put(body);
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
