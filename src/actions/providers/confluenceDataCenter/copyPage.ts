import type {
  confluenceDataCenterCopyPageFunction,
  confluenceDataCenterCopyPageParamsType,
  confluenceDataCenterCopyPageOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import {
  buildConfluencePageUrl,
  describeConfluenceError,
  requireStorageBody,
  resolveCopyPageDestination,
} from "../../util/confluenceCopyPage.js";
import { getConfluenceApi } from "./helpers.js";
import type { CopyPageDestination } from "../../util/confluenceCopyPage.js";
import type { AxiosRequestConfig } from "axios";

const ATTACHMENT_PAGE_SIZE = 200;

/**
 * Copies a Confluence Data Center page to another page entirely server-side, so the caller never has to reproduce
 * the page body.
 *
 * Data Center has no "copy page" REST endpoint, so this action fetches the source storage body and writes it to the
 * destination (creating a new page or adding a version to an existing one), then copies labels and attachments.
 * The body copy is the only fatal step; label/attachment problems are reported as warnings.
 */
const confluenceDataCenterCopyPage: confluenceDataCenterCopyPageFunction = async ({
  params,
  authParams,
}: {
  params: confluenceDataCenterCopyPageParamsType;
  authParams: AuthParamsType;
}): Promise<confluenceDataCenterCopyPageOutputType> => {
  const { sourcePageId, title, copyAttachments = true } = params;

  try {
    const destination = resolveCopyPageDestination(params);
    const { baseUrl, config } = getConfluenceApi(authParams);

    const sourceResponse = await axiosClient.get(
      `${baseUrl}/content/${sourcePageId}?expand=body.storage,version,metadata.labels`,
      config,
    );
    const sourceTitle: string = sourceResponse.data.title;
    const sourceBody = requireStorageBody(sourceResponse.data, sourcePageId);
    const sourceLabels = extractLabels(sourceResponse.data);

    const copied = await writeBody({ destination, title, sourceTitle, body: sourceBody, baseUrl, config });

    const warnings: string[] = [];
    await copyLabels({ pageId: copied.pageId, labels: sourceLabels, baseUrl, config, warnings });

    let attachmentsCopied = 0;
    if (copyAttachments) {
      attachmentsCopied = await copyAttachmentsToPage({
        sourcePageId,
        destinationPageId: copied.pageId,
        baseUrl,
        config,
        warnings,
      });
    }

    return {
      success: true,
      ...copied,
      attachmentsCopied,
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  } catch (error) {
    return {
      success: false,
      error: describeConfluenceError(error, "An unknown error occurred while copying the Confluence Data Center page."),
    };
  }
};

interface CopiedPage {
  pageId: string;
  title: string;
  version?: number;
  pageUrl?: string;
}

async function writeBody(args: {
  destination: CopyPageDestination;
  title?: string;
  sourceTitle: string;
  body: string;
  baseUrl: string;
  config: AxiosRequestConfig;
}): Promise<CopiedPage> {
  const { destination, title, sourceTitle, body, baseUrl, config } = args;
  const storage = { storage: { value: body, representation: "storage" } };

  if (destination.kind === "existingPage") {
    const destinationResponse = await axiosClient.get(
      `${baseUrl}/content/${destination.pageId}?expand=version`,
      config,
    );
    const resolvedTitle = title ?? destinationResponse.data.title ?? sourceTitle;
    const nextVersion = destinationResponse.data.version.number + 1;
    const response = await axiosClient.put(
      `${baseUrl}/content/${destination.pageId}`,
      { id: destination.pageId, type: "page", title: resolvedTitle, body: storage, version: { number: nextVersion } },
      config,
    );
    return {
      pageId: destination.pageId,
      title: resolvedTitle,
      version: typeof response.data?.version?.number === "number" ? response.data.version.number : nextVersion,
      pageUrl: buildConfluencePageUrl(response.data?._links),
    };
  }

  const resolvedTitle = title ?? sourceTitle;
  let spaceKey: string;
  let ancestors: { id: string }[] | undefined;
  if (destination.kind === "childOfPage") {
    const parentResponse = await axiosClient.get(`${baseUrl}/content/${destination.parentPageId}?expand=space`, config);
    spaceKey = parentResponse.data.space?.key;
    if (!spaceKey) {
      throw new Error(`Could not determine the space of parent page ${destination.parentPageId}.`);
    }
    ancestors = [{ id: destination.parentPageId }];
  } else {
    spaceKey = destination.spaceKey;
  }

  const response = await axiosClient.post(
    `${baseUrl}/content`,
    {
      type: "page",
      title: resolvedTitle,
      space: { key: spaceKey },
      ...(ancestors ? { ancestors } : {}),
      body: storage,
    },
    config,
  );
  return {
    pageId: String(response.data.id),
    title: typeof response.data?.title === "string" ? response.data.title : resolvedTitle,
    version: typeof response.data?.version?.number === "number" ? response.data.version.number : undefined,
    pageUrl: buildConfluencePageUrl(response.data?._links),
  };
}

interface Label {
  prefix: string;
  name: string;
}

function extractLabels(page: unknown): Label[] {
  const results = (page as { metadata?: { labels?: { results?: unknown[] } } })?.metadata?.labels?.results;
  if (!Array.isArray(results)) return [];
  return results
    .map(label => label as { prefix?: unknown; name?: unknown })
    .filter(label => typeof label.name === "string" && label.name !== "")
    .map(label => ({ prefix: typeof label.prefix === "string" ? label.prefix : "global", name: label.name as string }));
}

async function copyLabels(args: {
  pageId: string;
  labels: Label[];
  baseUrl: string;
  config: AxiosRequestConfig;
  warnings: string[];
}): Promise<void> {
  const { pageId, labels, baseUrl, config, warnings } = args;
  if (labels.length === 0) return;
  try {
    await axiosClient.post(`${baseUrl}/content/${pageId}/label`, labels, config);
  } catch (error) {
    warnings.push(`Labels could not be copied: ${describeConfluenceError(error, "unknown error")}`);
  }
}

interface Attachment {
  id: string;
  title: string;
  mediaType?: string;
  downloadPath?: string;
}

async function listAttachments(
  pageId: string,
  baseUrl: string,
  config: AxiosRequestConfig,
): Promise<{ attachments: Attachment[]; linkBase?: string }> {
  const attachments: Attachment[] = [];
  let linkBase: string | undefined;
  let start = 0;
  for (;;) {
    const response = await axiosClient.get(
      `${baseUrl}/content/${pageId}/child/attachment?start=${start}&limit=${ATTACHMENT_PAGE_SIZE}`,
      config,
    );
    const data = response.data ?? {};
    if (typeof data._links?.base === "string") linkBase = data._links.base;
    const results: unknown[] = Array.isArray(data.results) ? data.results : [];
    for (const item of results) {
      const record = item as { id?: unknown; title?: unknown; metadata?: { mediaType?: unknown }; _links?: unknown };
      if (typeof record.id !== "string" && typeof record.id !== "number") continue;
      if (typeof record.title !== "string") continue;
      const download = (record._links as { download?: unknown } | undefined)?.download;
      attachments.push({
        id: String(record.id),
        title: record.title,
        mediaType: typeof record.metadata?.mediaType === "string" ? record.metadata.mediaType : undefined,
        downloadPath: typeof download === "string" ? download : undefined,
      });
    }
    if (results.length < ATTACHMENT_PAGE_SIZE) break;
    start += results.length;
  }
  return { attachments, linkBase };
}

async function copyAttachmentsToPage(args: {
  sourcePageId: string;
  destinationPageId: string;
  baseUrl: string;
  config: AxiosRequestConfig;
  warnings: string[];
}): Promise<number> {
  const { sourcePageId, destinationPageId, baseUrl, config, warnings } = args;

  let source: { attachments: Attachment[]; linkBase?: string };
  try {
    source = await listAttachments(sourcePageId, baseUrl, config);
  } catch (error) {
    warnings.push(
      `Attachments could not be listed on the source page: ${describeConfluenceError(error, "unknown error")}`,
    );
    return 0;
  }
  if (source.attachments.length === 0) return 0;

  // When copying onto an existing page, attachments with the same filename must be updated rather than re-added.
  const existingByName = new Map<string, string>();
  try {
    const existing = await listAttachments(destinationPageId, baseUrl, config);
    for (const attachment of existing.attachments) existingByName.set(attachment.title, attachment.id);
  } catch (error) {
    warnings.push(
      `Attachments on the destination page could not be listed: ${describeConfluenceError(error, "unknown error")}`,
    );
  }

  // `_links.download` is relative to the site (including its context path); `_links.base` gives exactly that.
  const siteBase = source.linkBase ?? baseUrl.replace(/\/rest\/api$/, "");
  const authorization = config.headers?.Authorization;
  const uploadHeaders = {
    Accept: "application/json",
    Authorization: authorization,
    "X-Atlassian-Token": "nocheck",
  };

  let copied = 0;
  for (const attachment of source.attachments) {
    if (!attachment.downloadPath) {
      warnings.push(`Attachment "${attachment.title}" has no download link and was skipped.`);
      continue;
    }
    try {
      const download = await axiosClient.get(`${siteBase}${attachment.downloadPath}`, {
        headers: { Authorization: authorization },
        responseType: "arraybuffer",
      });
      const form = new FormData();
      form.append(
        "file",
        new Blob([download.data], { type: attachment.mediaType ?? "application/octet-stream" }),
        attachment.title,
      );
      form.append("minorEdit", "true");

      const existingId = existingByName.get(attachment.title);
      const url = existingId
        ? `${baseUrl}/content/${destinationPageId}/child/attachment/${existingId}/data`
        : `${baseUrl}/content/${destinationPageId}/child/attachment`;
      await axiosClient.post(url, form, { headers: uploadHeaders });
      copied += 1;
    } catch (error) {
      warnings.push(
        `Attachment "${attachment.title}" could not be copied: ${describeConfluenceError(error, "unknown error")}`,
      );
    }
  }
  return copied;
}

export default confluenceDataCenterCopyPage;
