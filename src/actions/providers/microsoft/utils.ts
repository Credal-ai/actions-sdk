import { Client } from "@microsoft/microsoft-graph-client";
import type { AuthParamsType } from "../../autogen/types.js";

export async function getGraphClient(authParams: AuthParamsType, scope: string): Promise<Client> {
  if (
    !authParams.authToken
  ) {
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
