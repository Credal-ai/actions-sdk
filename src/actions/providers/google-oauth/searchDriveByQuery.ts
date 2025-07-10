import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthSearchDriveByQueryFunction,
  googleOauthSearchDriveByQueryParamsType,
  googleOauthSearchDriveByQueryOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

interface DriveInfo {
  id: string;
  name: string;
}

type DriveFile = { id: string; name: string; mimeType: string; url: string };

const searchDriveByQuery: googleOauthSearchDriveByQueryFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthSearchDriveByQueryParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthSearchDriveByQueryOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, files: [] };
  }

  const { query, limit, searchDriveByDrive } = params;

  try {
    if (searchDriveByDrive) {
      return await searchAllDrivesIndividually(query, authParams.authToken, limit);
    } else {
      return await searchAllDrivesAtOnce(query, authParams.authToken, limit);
    }
  } catch (error) {
    console.error("Error searching Google Drive", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      files: [],
    };
  }
};

// Original search method - search all drives at once
const searchAllDrivesAtOnce = async (
  query: string,
  authToken: string,
  limit?: number,
): Promise<googleOauthSearchDriveByQueryOutputType> => {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query,
  )}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=1000`;

  const res = await axiosClient.get(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const files =
    res.data.files?.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      url: file.webViewLink || "",
    })) || [];

  return {
    success: true,
    files: limit ? files.slice(0, limit) : files,
  };
};

// New search method - search each drive individually and aggregate results
const searchAllDrivesIndividually = async (
  query: string,
  authToken: string,
  limit?: number,
): Promise<googleOauthSearchDriveByQueryOutputType> => {
  const drives = await getAllDrives(authToken);
  let allFiles: Array<DriveFile> = [];

  // Search each drive individually
  for (const drive of drives) {
    try {
      const driveFiles = await searchSingleDrive(query, drive.id, authToken);
      allFiles = allFiles.concat(driveFiles);

      // If we have a limit and we've reached it, break early
      if (limit && allFiles.length >= limit) {
        break;
      }
    } catch (error) {
      console.error(`Error searching drive ${drive.name} (${drive.id}):`, error);
    }
  }

  return {
    success: true,
    files: limit ? allFiles.slice(0, limit) : allFiles,
  };
};

// Get all drives (shared drives + user's drive)
const getAllDrives = async (authToken: string): Promise<DriveInfo[]> => {
  const drives: DriveInfo[] = [];

  // Add user's personal drive (My Drive)
  drives.push({ id: "root", name: "My Drive" });

  // Get all shared drives
  let nextPageToken: string | undefined;

  do {
    const url = `https://www.googleapis.com/drive/v3/drives?pageSize=100${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;

    const res = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const sharedDrives =
      res.data.drives?.map((drive: { id?: string; name?: string }) => ({
        id: drive.id || "",
        name: drive.name || "",
      })) || [];

    drives.push(...sharedDrives);
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return drives;
};

// Search a single drive
const searchSingleDrive = async (query: string, driveId: string, authToken: string): Promise<Array<DriveFile>> => {
  const files: Array<DriveFile> = [];

  let nextPageToken: string | undefined;

  do {
    let url: string;

    if (driveId === "root") {
      // Search in user's personal drive
      url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query,
      )}&fields=files(id,name,mimeType,webViewLink),nextPageToken&pageSize=1000${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }`;
    } else {
      // Search in specific shared drive
      url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `${query} and parents in '${driveId}'`,
      )}&fields=files(id,name,mimeType,webViewLink),nextPageToken&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${driveId}&pageSize=1000${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }`;
    }

    const res = await axiosClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const driveFiles =
      res.data.files?.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
        id: file.id || "",
        name: file.name || "",
        mimeType: file.mimeType || "",
        url: file.webViewLink || "",
      })) || [];

    files.push(...driveFiles);
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return files;
};

export default searchDriveByQuery;
