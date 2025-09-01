import type { DriveFile } from "./common.js";

export function dedupeByIdKeepFirst<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (!it.id || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

// Helper function to check if a file should be excluded (images and folders)
const shouldExcludeFile = (file: DriveFile): boolean => {
  const mimeType = file.mimeType.toLowerCase();

  // Exclude folders
  if (mimeType === "application/vnd.google-apps.folder") {
    return true;
  }

  // Exclude common image formats
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
    "image/webp",
    "image/tiff",
    "image/ico",
    "image/heic",
    "image/heif",
  ];

  return imageTypes.includes(mimeType);
};

// Helper function to filter files
export const filterReadableFiles = (files: DriveFile[]): DriveFile[] => {
  return files.filter(file => !shouldExcludeFile(file));
};
