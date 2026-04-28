import type { AxiosRequestConfig } from "axios";

export function getConfluenceApi(authParams: { baseUrl?: string; authToken?: string }): {
  baseUrl: string;
  config: AxiosRequestConfig;
} {
  const { baseUrl, authToken } = authParams;

  if (!authToken) {
    throw new Error("Auth Token is required");
  }

  if (!baseUrl) {
    throw new Error("Base URL is required for Confluence Data Center");
  }

  const trimmedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return {
    baseUrl: `${trimmedUrl}/rest/api`,
    config: {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    },
  };
}
