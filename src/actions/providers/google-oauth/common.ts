export interface DriveInfo {
  id: string;
  name: string;
}

export type DriveFile = { id: string; name: string; mimeType: string; url: string };

export type DriveFileMetadata = {
  name?: string;
  mimeType?: string;
  size?: string;
  driveId?: string;
  parents?: string[];
  shortcutDetails?: { targetId?: string; targetMimeType?: string };
};
