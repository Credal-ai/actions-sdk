import type { AxiosRequestConfig } from "axios";

export function getConfluenceRequestConfig(baseUrl: string, authToken: string): AxiosRequestConfig {
  return {
    baseURL: baseUrl,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
}
