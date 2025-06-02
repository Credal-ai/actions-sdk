import { axiosClient } from "../../util/axiosClient";
import type {
  AuthParamsType,
  googlemailSearchGmailMessagesFunction,
  googlemailSearchGmailMessagesOutputType,
  googlemailSearchGmailMessagesParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";
import { getEmailContent } from "../google-oauth/utils/decodeMessage";

const searchGmailMessages: googlemailSearchGmailMessagesFunction = async ({
  params,
  authParams,
}: {
  params: googlemailSearchGmailMessagesParamsType;
  authParams: AuthParamsType;
}): Promise<googlemailSearchGmailMessagesOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, messages: [] };
  }

  const { query, maxResults } = params;

  const allMessages = [];
  const max = maxResults ?? 100;
  const errorMessages: string[] = [];
  let pageToken = undefined;
  let fetched = 0;

  try {
    while (fetched < max) {
      const url: string =
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "") +
        `&maxResults=${Math.min(100, max - fetched)}`;

      const listRes = await axiosClient.get(url, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
      });

      const { messages: messageList = [], nextPageToken } = listRes.data;
      if (!Array.isArray(messageList) || messageList.length === 0) break;

      const remaining = max - allMessages.length;
      const batch = messageList.slice(0, remaining);
      const results = await Promise.all(
        batch.map(async msg => {
          try {
            const msgRes = await axiosClient.get(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
              {
                headers: {
                  Authorization: `Bearer ${authParams.authToken}`,
                },
              },
            );
            const { id, threadId, snippet, labelIds, internalDate } = msgRes.data;
            const emailBody = getEmailContent(msgRes.data) || "";
            return {
              id,
              threadId,
              snippet,
              labelIds,
              internalDate,
              emailBody,
            };
          } catch (err) {
            errorMessages.push(err instanceof Error ? err.message : "Failed to fetch message details");
            return {
              id: msg.id,
              threadId: "",
              snippet: "",
              labelIds: [],
              internalDate: "",
              payload: {},
              error: err instanceof Error ? err.message : "Failed to fetch message details",
            };
          }
        }),
      );

      allMessages.push(...results);

      fetched = allMessages.length;
      if (!nextPageToken || allMessages.length >= max) break;
      pageToken = nextPageToken;
    }

    return {
      success: errorMessages.length === 0,
      messages: allMessages,
      error: errorMessages.join("; "),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error searching Gmail",
      messages: [],
    };
  }
};

export default searchGmailMessages;
