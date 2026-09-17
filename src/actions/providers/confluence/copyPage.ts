import type {
  confluenceCopyPageFunction,
  confluenceCopyPageParamsType,
  confluenceCopyPageOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { ApiError, axiosClient } from "../../util/axiosClient.js";
import {
  buildConfluencePageUrl,
  describeConfluenceError,
  isConfluenceOptimisticLockError,
  resolveCopyPageDestination,
} from "../../util/confluenceCopyPage.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getConfluenceRequestConfig } from "./helpers.js";
import type { CopyPageDestination } from "../../util/confluenceCopyPage.js";
import type { AxiosRequestConfig } from "axios";

const COPY_ATTEMPTS = 3;
const COPY_RETRY_DELAY_MS = 1000;

/**
 * Copies a Confluence Cloud page to another page entirely server-side, so the caller never has to reproduce the
 * page body.
 *
 * The primary path is Confluence's native "copy single page" endpoint (REST v1), which copies the storage body,
 * attachments, labels and content properties in one call. If that endpoint is not usable for this token (e.g.
 * missing scope), the action falls back to copying the storage body via the v2 pages API; attachments cannot be
 * copied on that path and a warning is returned instead.
 */
const confluenceCopyPage: confluenceCopyPageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceCopyPageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceCopyPageOutputType> => {
  const { sourcePageId, title, copyAttachments = true } = params;
  const { authToken } = authParams;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  try {
    const destination = resolveCopyPageDestination(params);

    const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const cloudId = cloudDetails.data[0].id;
    const v1Config = getConfluenceRequestConfig(
      `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api`,
      authToken,
    );
    const v2Config = getConfluenceRequestConfig(`https://api.atlassian.com/ex/confluence/${cloudId}/api/v2`, authToken);

    // Fetch the source page: confirms it exists, provides the default title, and supplies the body for the fallback.
    const sourceResponse = await axiosClient.get(`/pages/${sourcePageId}?body-format=storage`, v2Config);
    const sourceTitle: string = sourceResponse.data.title;
    const sourceBody: string = sourceResponse.data.body?.storage?.value ?? "";

    let destinationPage: { title: string; version: number } | undefined;
    if (destination.kind === "existingPage") {
      const destinationResponse = await axiosClient.get(`/pages/${destination.pageId}`, v2Config);
      destinationPage = {
        title: destinationResponse.data.title,
        version: destinationResponse.data.version.number,
      };
    }
    const resolvedTitle = title ?? destinationPage?.title ?? sourceTitle;

    // 1. Native copy (body + attachments + labels + properties).
    try {
      const copied = await nativeCopy({
        sourcePageId,
        destination,
        title: resolvedTitle,
        copyAttachments,
        config: v1Config,
      });
      return {
        success: true,
        pageId: copied.pageId,
        title: copied.title,
        version: copied.version,
        pageUrl: copied.pageUrl,
        attachmentsCopied: copyAttachments ? copied.attachmentsCopied : 0,
      };
    } catch (error) {
      if (!shouldFallBackToBodyCopy(error)) throw error;

      // 2. Fallback: copy the storage body with the v2 API. Nothing has been changed yet at this point.
      const copied = await bodyCopy({
        destination,
        title: resolvedTitle,
        body: sourceBody,
        destinationVersion: destinationPage?.version,
        config: v2Config,
      });
      const reason = error instanceof ApiError && error.status ? `HTTP ${error.status}` : "an error";
      const warnings = [
        `The native copy endpoint was unavailable (${reason}); the page body was copied directly instead.`,
      ];
      if (copyAttachments) {
        warnings.push(
          "Attachments were not copied. Images or files embedded in the page will need to be re-attached to the copy.",
        );
      }
      return { success: true, ...copied, attachmentsCopied: 0, warnings };
    }
  } catch (error) {
    return {
      success: false,
      error: describeConfluenceError(error, "An unknown error occurred while copying the Confluence page."),
    };
  }
};

interface CopiedPage {
  pageId: string;
  title: string;
  version?: number;
  pageUrl?: string;
}

async function nativeCopy(args: {
  sourcePageId: string;
  destination: CopyPageDestination;
  title: string;
  copyAttachments: boolean;
  config: AxiosRequestConfig;
}): Promise<CopiedPage & { attachmentsCopied: number }> {
  const { sourcePageId, destination, title, copyAttachments, config } = args;

  const payload = {
    destination: toNativeDestination(destination),
    pageTitle: title,
    copyAttachments,
    copyLabels: true,
    copyProperties: true,
    copyPermissions: false,
    copyCustomContents: false,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= COPY_ATTEMPTS; attempt++) {
    try {
      const response = await axiosClient.post(`/content/${sourcePageId}/copy?expand=version`, payload, config);
      const data = response.data ?? {};
      const pageId = String(data.id ?? (destination.kind === "existingPage" ? destination.pageId : ""));
      let attachmentsCopied = 0;
      if (copyAttachments) {
        attachmentsCopied = await countAttachments(pageId, config);
      }
      return {
        pageId,
        title: typeof data.title === "string" ? data.title : title,
        version: typeof data.version?.number === "number" ? data.version.number : undefined,
        pageUrl: buildConfluencePageUrl(data._links),
        attachmentsCopied,
      };
    } catch (error) {
      lastError = error;
      if (!isConfluenceOptimisticLockError(error) || attempt === COPY_ATTEMPTS) throw error;
      await new Promise(resolve => setTimeout(resolve, COPY_RETRY_DELAY_MS * attempt));
    }
  }
  throw lastError;
}

function toNativeDestination(destination: CopyPageDestination): { type: string; value: string } {
  switch (destination.kind) {
    case "existingPage":
      return { type: "existing_page", value: destination.pageId };
    case "childOfPage":
      return { type: "parent_page", value: destination.parentPageId };
    case "spaceRoot":
      return { type: "space", value: destination.spaceKey };
  }
}

async function countAttachments(pageId: string, config: AxiosRequestConfig): Promise<number> {
  if (!pageId) return 0;
  try {
    const response = await axiosClient.get(`/content/${pageId}/child/attachment?limit=200`, config);
    const results = response.data?.results;
    return Array.isArray(results) ? results.length : 0;
  } catch {
    // The copy itself succeeded; a failure to count attachments must not fail the action.
    return 0;
  }
}

/**
 * The native copy endpoint is only skipped when it is clearly not usable for this token/site (missing scope,
 * endpoint removed, method not allowed). Any other failure (permissions on the destination, title conflicts,
 * validation errors) is reported to the caller as-is, since the fallback would fail for the same reason.
 */
function shouldFallBackToBodyCopy(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return (
    error.status === 403 || error.status === 404 || error.status === 405 || error.status === 410 || error.status === 501
  );
}

async function bodyCopy(args: {
  destination: CopyPageDestination;
  title: string;
  body: string;
  destinationVersion?: number;
  config: AxiosRequestConfig;
}): Promise<CopiedPage> {
  const { destination, title, body, destinationVersion, config } = args;
  const storageBody = { representation: "storage", value: body };

  if (destination.kind === "existingPage") {
    const nextVersion = (destinationVersion ?? 0) + 1;
    const response = await axiosClient.put(
      `/pages/${destination.pageId}`,
      { id: destination.pageId, status: "current", title, body: storageBody, version: { number: nextVersion } },
      config,
    );
    return {
      pageId: destination.pageId,
      title,
      version: typeof response.data?.version?.number === "number" ? response.data.version.number : nextVersion,
      pageUrl: buildConfluencePageUrl(response.data?._links),
    };
  }

  let spaceId: string;
  let parentId: string | undefined;
  if (destination.kind === "childOfPage") {
    const parentResponse = await axiosClient.get(`/pages/${destination.parentPageId}`, config);
    spaceId = String(parentResponse.data.spaceId);
    parentId = destination.parentPageId;
  } else {
    const spaceResponse = await axiosClient.get(`/spaces?keys=${encodeURIComponent(destination.spaceKey)}`, config);
    const space = spaceResponse.data?.results?.[0];
    if (!space?.id) {
      throw new Error(`No Confluence space with key "${destination.spaceKey}" was found.`);
    }
    spaceId = String(space.id);
  }

  const response = await axiosClient.post(
    "/pages",
    { spaceId, status: "current", title, ...(parentId ? { parentId } : {}), body: storageBody },
    config,
  );
  return {
    pageId: String(response.data.id),
    title: typeof response.data?.title === "string" ? response.data.title : title,
    version: typeof response.data?.version?.number === "number" ? response.data.version.number : undefined,
    pageUrl: buildConfluencePageUrl(response.data?._links),
  };
}

export default confluenceCopyPage;
