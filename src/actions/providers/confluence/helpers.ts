import type { AxiosRequestConfig } from "axios";
import { axiosClient } from "../../util/axiosClient.js";

/**
 * Resolves the Atlassian Cloud ID for the site the action should operate on.
 *
 * The authentication context selects the site via `authParams.cloudId`; that must win, because a single OAuth token
 * can grant access to several sites and the order of `accessible-resources` is not meaningful. The lookup is only a
 * fallback for callers that do not supply a Cloud ID.
 */
export async function resolveConfluenceCloudId(authParams: { cloudId?: string; authToken: string }): Promise<string> {
  if (authParams.cloudId) return authParams.cloudId;

  const cloudDetails = await axiosClient.get("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${authParams.authToken}` },
  });
  const resources: unknown = cloudDetails.data;
  const first = Array.isArray(resources) ? (resources[0] as { id?: unknown } | undefined) : undefined;
  if (typeof first?.id !== "string" || first.id === "") {
    throw new Error(
      "Could not determine the Confluence Cloud site: no cloudId was provided and the token has no accessible resources.",
    );
  }
  return first.id;
}

export function getConfluenceRequestConfig(baseUrl: string, authToken: string): AxiosRequestConfig {
  return {
    baseURL: baseUrl,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
}
