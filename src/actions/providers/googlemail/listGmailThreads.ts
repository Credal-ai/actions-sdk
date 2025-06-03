import { axiosClient } from "../../util/axiosClient";
import type {
  AuthParamsType,
  googlemailListGmailThreadsFunction,
  googlemailListGmailThreadsOutputType,
  googlemailListGmailThreadsParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
import { getEmailContent } from "../google-oauth/utils/decodeMessage";

const listGmailThreads: googlemailListGmailThreadsFunction = async ({
  params,
  authParams,
}: {
  params: googlemailListGmailThreadsParamsType;
  authParams: AuthParamsType;
}): Promise<googlemailListGmailThreadsOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, threads: [] };
  }

  const { query, maxResults } = params;

  const allThreads = [];
  const errorMessages: string[] = [];
  const max = maxResults ?? 100;
  let fetched = 0;
  let pageToken = undefined;

  try {
    while (fetched < max) {
      const url: string =
        `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "") +
        `&maxResults=${Math.min(100, max - fetched)}`;

      const listRes = await axiosClient.get(url, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
      });

      const { threads: threadList = [], nextPageToken } = listRes.data;
      if (!Array.isArray(threadList) || threadList.length === 0) break;

      const remaining = max - allThreads.length;
      const batch = threadList.slice(0, remaining);
      const results = await Promise.all(
        batch.map(async thread => {
          try {
            const threadRes = await axiosClient.get(
              `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=full`,
              {
                headers: {
                  Authorization: `Bearer ${authParams.authToken}`,
                },
              },
            );
            const { id, historyId, messages } = threadRes.data;
            return {
              id,
              historyId,
              messages: Array.isArray(messages)
                ? messages.map(msg => {
                    const { id, threadId, snippet, labelIds, internalDate } = msg;
                    const emailBody = getEmailContent(msg) || "";
                    return {
                      id,
                      threadId,
                      snippet,
                      labelIds,
                      internalDate,
                      emailBody,
                    };
                  })
                : [],
            };
          } catch (err) {
            errorMessages.push(err instanceof Error ? err.message : "Failed to fetch thread details");
            return {
              id: thread.id,
              snippet: "",
              historyId: "",
              messages: [],
              error: err instanceof Error ? err.message : "Failed to fetch thread details",
            };
          }
        }),
      );

      allThreads.push(...results);

      fetched = allThreads.length;
      if (!nextPageToken || allThreads.length >= max) break;
      pageToken = nextPageToken;
    }

    return {
      success: errorMessages.length === 0,
      threads: allThreads,
      error: errorMessages.join("; "),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error listing Gmail threads",
      threads: [],
    };
  }
};

export default listGmailThreads;
