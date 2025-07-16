/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import axios from "axios";

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Create a configured axios instance with interceptors */
function createAxiosClient(timeout?: number): AxiosInstance {
  const instance = axios.create({
    timeout: timeout,
  });

  instance.interceptors.request.use(
    config => {
      return config;
    },
    error => {
      console.error("Request setup error:", error.message);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        console.error(`API error:`, error.response.status, error.response.data);
        return Promise.reject(
          new ApiError(
            `Request failed with status ${error.response.status}`,
            error.response.status,
            error.response.data,
          ),
        );
      } else if (error.request) {
        console.error(`No response received:`, error.config?.url);
        return Promise.reject(
          new ApiError(`No response received from server for ${error.config?.url || "unknown endpoint"}`),
        );
      } else {
        console.error(`Request setup error:`, error.message);
        return Promise.reject(new ApiError(`Error making request: ${error.message}`));
      }
    },
  );
  return instance;
}

export const axiosClient = createAxiosClient();

export function createAxiosClientWithTimeout(timeout: number): AxiosInstance {
  return createAxiosClient(timeout);
}
