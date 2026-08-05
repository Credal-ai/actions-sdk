import { Client } from "@microsoft/microsoft-graph-client";
import { Document, Packer, Paragraph, TextRun } from "docx";
import type { AuthParamsType } from "../../autogen/types.js";

export async function getGraphClient(authParams: AuthParamsType): Promise<Client> {
  if (!authParams.authToken) {
    throw new Error("Missing required authentication parameters");
  }
  const accessToken = authParams.authToken;
  return Client.init({
    authProvider: done => {
      done(null, accessToken);
    },
  });
}

/**
 * Builds the Graph API path prefix addressing a drive. Item IDs are scoped to a drive, so a
 * driveId (when known) addresses the exact document library; /sites/{siteId}/drive only ever
 * reaches the site's default library, and /me/drive the user's personal OneDrive.
 */
export function getDrivePath({ driveId, siteId }: { driveId?: string; siteId?: string }): string {
  return driveId ? `/drives/${driveId}` : siteId ? `/sites/${siteId}/drive` : "/me/drive";
}

/**
 * Validates and sanitizes a filename for SharePoint or OneDrive.
 * @param fileName The original filename to validate and sanitize.
 * @returns A sanitized filename that is safe to use.
 */
export function validateAndSanitizeFileName(fileName: string): string {
  // Define invalid characters for SharePoint and OneDrive
  const invalidCharacters = /[~"#%&*:<>?/{|}\\]/g;

  // Replace invalid characters with an underscore
  let sanitizedFileName = fileName.replace(invalidCharacters, "_");

  // Remove leading or trailing spaces
  sanitizedFileName = sanitizedFileName.trim();

  // Replace consecutive periods with a single period
  sanitizedFileName = sanitizedFileName.replace(/\.{2,}/g, ".");

  // Ensure the filename does not exceed 400 characters
  if (sanitizedFileName.length > 400) {
    const extensionIndex = sanitizedFileName.lastIndexOf(".");
    const baseName = sanitizedFileName.slice(0, extensionIndex);
    const extension = sanitizedFileName.slice(extensionIndex);
    sanitizedFileName = baseName.slice(0, 400 - extension.length) + extension;
  }

  return sanitizedFileName;
}

// Office formats that are binary/ZIP containers. Writing plain text bytes under these
// extensions produces a file the corresponding Office app cannot open.
const UNSUPPORTED_OFFICE_EXTENSIONS = [".doc", ".xlsx", ".xls", ".pptx", ".ppt"];

export function fileNameHasDocxExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".docx");
}

export function getUnsupportedOfficeExtension(fileName: string): string | undefined {
  const lowerCaseFileName = fileName.toLowerCase();
  return UNSUPPORTED_OFFICE_EXTENSIONS.find(extension => lowerCaseFileName.endsWith(extension));
}

/**
 * Builds a valid .docx file from plain text, one paragraph per line. A .docx is a ZIP
 * archive of XML parts, so text bytes written directly under a .docx name produce a
 * corrupted document — the bytes must be generated with an OOXML writer.
 */
export async function generateDocxFromPlainText(text: string): Promise<Buffer> {
  const paragraphs = text.split(/\r?\n/).map(line => new Paragraph({ children: [new TextRun({ text: line })] }));
  const document = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  return Packer.toBuffer(document);
}

export const MICROSOFT_GRAPH_API_URL = "https://graph.microsoft.com/v1.0";
