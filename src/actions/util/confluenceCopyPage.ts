import { ApiError } from "./axiosClient.js";

/**
 * Helpers shared by the Confluence Cloud and Confluence Data Center `copyPage` actions.
 */

export type CopyPageDestination =
  | { kind: "existingPage"; pageId: string }
  | { kind: "childOfPage"; parentPageId: string }
  | { kind: "spaceRoot"; spaceKey: string };

export interface CopyPageDestinationParams {
  destinationPageId?: string;
  parentPageId?: string;
  spaceKey?: string;
}

/**
 * The caller must specify exactly one of `destinationPageId`, `parentPageId` or `spaceKey`.
 * Throws a descriptive error otherwise so the agent can correct the call.
 */
export function resolveCopyPageDestination(params: CopyPageDestinationParams): CopyPageDestination {
  const provided = [
    params.destinationPageId ? "destinationPageId" : undefined,
    params.parentPageId ? "parentPageId" : undefined,
    params.spaceKey ? "spaceKey" : undefined,
  ].filter((name): name is string => name !== undefined);

  if (provided.length === 0) {
    throw new Error(
      "A destination is required: provide destinationPageId (replace an existing page), parentPageId (create a new child page) or spaceKey (create a new root page).",
    );
  }
  if (provided.length > 1) {
    throw new Error(`Provide exactly one destination, not several (${provided.join(", ")} were all given).`);
  }

  if (params.destinationPageId) return { kind: "existingPage", pageId: params.destinationPageId };
  if (params.parentPageId) return { kind: "childOfPage", parentPageId: params.parentPageId };
  return { kind: "spaceRoot", spaceKey: params.spaceKey as string };
}

/**
 * Confluence returns useful detail (e.g. "A page with this title already exists") in the response body, which the
 * generic ApiError message does not include. Surface it so the agent can react (e.g. pick a different title).
 */
export function describeConfluenceError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const detail = extractConfluenceErrorMessage(error.data);
    return detail ? `${error.message}: ${detail}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function extractConfluenceErrorMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data.length > 0 && data.length <= 500 ? data : undefined;
  if (typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  const candidates = [
    record.message,
    (record.data as Record<string, unknown> | undefined)?.message,
    Array.isArray(record.errors) ? (record.errors[0] as Record<string, unknown> | undefined)?.title : undefined,
    Array.isArray(record.errors) ? (record.errors[0] as Record<string, unknown> | undefined)?.message : undefined,
  ];
  const message = candidates.find(
    (candidate): candidate is string => typeof candidate === "string" && candidate !== "",
  );
  return message;
}

/**
 * Confluence Cloud's copy endpoint intermittently fails with an optimistic-locking conflict when the destination page
 * was modified/created moments before. These are safe to retry.
 */
export function isConfluenceOptimisticLockError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 409) return true;
  const detail = extractConfluenceErrorMessage(error.data) ?? "";
  return /optimistic ?lock|StaleObjectStateException/i.test(detail);
}

export function buildConfluencePageUrl(links: unknown): string | undefined {
  if (!links || typeof links !== "object") return undefined;
  const { base, webui } = links as { base?: unknown; webui?: unknown };
  if (typeof base !== "string" || typeof webui !== "string") return undefined;
  return `${base}${webui}`;
}
