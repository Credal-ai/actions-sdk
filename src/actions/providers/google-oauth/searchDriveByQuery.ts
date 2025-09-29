import { axiosClient } from "../../util/axiosClient.js";
import type {
  AuthParamsType,
  googleOauthSearchDriveByQueryFunction,
  googleOauthSearchDriveByQueryParamsType,
  googleOauthSearchDriveByQueryOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import type { DriveFile, DriveInfo } from "./common.js";
import { dedupeByIdKeepFirst, filterReadableFiles } from "./utils.js";

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

  const { query, limit, searchDriveByDrive, orderByQuery, includeTrashed = false } = params;

  // Can't use orderBy on quereis that include fullText
  const safeOrderBy = query.includes("fullText") ? undefined : (orderByQuery ?? "modifiedTime desc");

  const finalQuery = includeTrashed ? query : `${query} and trashed=false`;

  try {
    if (searchDriveByDrive) {
      return await searchAllDrivesIndividually(finalQuery, authParams.authToken, limit, safeOrderBy);
    } else {
      return await searchAllDrivesAtOnce(finalQuery, authParams.authToken, limit, safeOrderBy);
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
  orderByQuery?: string,
): Promise<googleOauthSearchDriveByQueryOutputType> => {
  const allDrivesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query,
  )}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives&pageSize=100${orderByQuery ? `&orderBy=${encodeURIComponent(orderByQuery)}` : ""}`;

  const allDrivesRes = axiosClient.get(allDrivesUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  // need to search domain wide separately because the allDrives search doesn't include domain wide files
  const orgWideUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query,
  )}&fields=files(id,name,mimeType,webViewLink)&corpora=domain&pageSize=100${
    orderByQuery ? `&orderBy=${encodeURIComponent(orderByQuery)}` : ""
  }`;

  const orgWideRes = axiosClient.get(orgWideUrl, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const results = await Promise.all([allDrivesRes, orgWideRes]);

  const relevantResults = results
    .map(result => result.data.files)
    .filter(Boolean)
    .map(files => filterReadableFiles(files));
  const relevantResultsFlat = relevantResults.flat();

  const files =
    relevantResultsFlat.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      url: file.webViewLink || "",
    })) || [];

  const dedupedFiles = dedupeByIdKeepFirst(files);

  return {
    success: true,
    files: limit ? dedupedFiles.slice(0, limit) : dedupedFiles,
  };
};

// New search method - search each drive individually and aggregate results
const searchAllDrivesIndividually = async (
  query: string,
  authToken: string,
  limit?: number,
  orderByQuery?: string,
): Promise<googleOauthSearchDriveByQueryOutputType> => {
  const drives = await getAllDrives(authToken);
  let allFiles: Array<DriveFile> = [];

  const domainUrl =
    `https://www.googleapis.com/drive/v3/files?` +
    `q=${encodeURIComponent(query)}&` +
    `fields=files(id,name,mimeType,webViewLink),nextPageToken&` +
    `corpora=domain&` +
    `pageSize=100${orderByQuery ? `&orderBy=${encodeURIComponent(orderByQuery)}` : ""}`;

  const domainDriveFunction = async () => {
    const domainRes = await axiosClient.get(domainUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return filterReadableFiles(
      domainRes.data.files?.map((file: { id?: string; name?: string; mimeType?: string; webViewLink?: string }) => ({
        id: file.id || "",
        name: file.name || "",
        mimeType: file.mimeType || "",
        url: file.webViewLink || "",
      })) ?? [],
    );
  };

  // Search each drive individually
  const results = await Promise.allSettled([
    domainDriveFunction(),
    ...drives.map(async drive => {
      try {
        const driveFiles = await searchSingleDrive(query, drive.id, authToken, orderByQuery);
        // Filter out images and folders before adding to results
        return filterReadableFiles(driveFiles);
      } catch (error) {
        console.error(`Error searching drive ${drive.name} (${drive.id}):`, error);
        return [];
      }
    }),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      allFiles = allFiles.concat(result.value.slice(0, limit));
    }
  }

  const dedupedFiles = dedupeByIdKeepFirst(allFiles);

  return {
    success: true,
    files: limit ? dedupedFiles.slice(0, limit) : dedupedFiles,
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
const searchSingleDrive = async (
  query: string,
  driveId: string,
  authToken: string,
  orderByQuery?: string,
): Promise<Array<DriveFile>> => {
  const files: Array<DriveFile> = [];

  let nextPageToken: string | undefined;

  do {
    let url: string;

    if (driveId === "root") {
      // Search in user's personal drive
      url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query,
      )}&fields=files(id,name,mimeType,webViewLink),nextPageToken&pageSize=100${orderByQuery ? `&orderBy=${encodeURIComponent(orderByQuery)}` : ""}${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }`;
    } else {
      // Search in specific shared drive
      url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `${query} and parents in '${driveId}'`,
      )}&fields=files(id,name,mimeType,webViewLink),nextPageToken&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=${driveId}&pageSize=100${orderByQuery ? `&orderBy=${encodeURIComponent(orderByQuery)}` : ""}${
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
