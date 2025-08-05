import { RateLimiter } from "limiter";
import { axiosClient } from "../../util/axiosClient.js";
import { getEmailContent } from "../google-oauth/utils/decodeMessage.js"; // see below for updated version
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import type {
  AuthParamsType,
  googlemailSearchGmailMessagesFunction,
  googlemailSearchGmailMessagesOutputType,
  googlemailSearchGmailMessagesParamsType,
} from "../../autogen/types.js";

// Limit to 10 requests/sec per user (50 quota units max)
const limiter = new RateLimiter({ tokensPerInterval: 10, interval: "second" });

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function cleanAndTruncateEmail(text: string, maxLength = 2000): string {
  if (!text) return "";

  // Remove quoted replies (naive)
  text = text.replace(/^>.*$/gm, "");

  // Remove signatures (based on common sign-offs)
  const signatureMarkers = ["\nBest", "\nRegards", "\nThanks", "\nSincerely"];
  for (const marker of signatureMarkers) {
    const index = text.indexOf(marker);
    if (index !== -1) {
      text = text.substring(0, index).trim();
      break;
    }
  }

  // Normalize whitespace
  text = text
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.slice(0, maxLength).trim();
}

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
  const max = Math.min(maxResults ?? 25, 50); // Cap at 50 messages

  const allMessages = [];
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
        headers: { Authorization: `Bearer ${authParams.authToken}` },
      });

      const { messages: messageList = [], nextPageToken } = listRes.data;
      if (!Array.isArray(messageList) || messageList.length === 0) break;

      const batch = messageList.slice(0, max - allMessages.length);

      for (const msg of batch) {
        await limiter.removeTokens(1); // Rate limiting

        try {
          const msgRes = await axiosClient.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: { Authorization: `Bearer ${authParams.authToken}` },
              validateStatus: () => true,
            },
          );

          if (msgRes.status === 429) {
            const retryAfter = parseInt(msgRes.headers["retry-after"] ?? "2", 10);
            await delay((retryAfter || 2) * 1000);
            continue;
          }

          if (msgRes.status >= 400) {
            throw new Error(`HTTP ${msgRes.status}: ${msgRes.statusText}`);
          }

          const { id, threadId, snippet, labelIds, internalDate } = msgRes.data;
          const rawBody = getEmailContent(msgRes.data) || "";
          const emailBody = cleanAndTruncateEmail(rawBody);

          allMessages.push({
            id,
            threadId,
            snippet,
            labelIds,
            internalDate,
            emailBody,
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch message details";
          errorMessages.push(errorMessage);
          allMessages.push({
            id: msg.id,
            threadId: "",
            snippet: "",
            labelIds: [],
            internalDate: "",
            emailBody: "",
            error: errorMessage,
          });
        }

        fetched = allMessages.length;
        if (fetched >= max) break;
      }

      if (!nextPageToken || fetched >= max) break;
      pageToken = nextPageToken;
    }

    return {
      success: errorMessages.length === 0,
      messages: allMessages,
      error: errorMessages.join("; "),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error searching Gmail";
    return {
      success: false,
      error: errorMessage,
      messages: [],
    };
  }
};

export default searchGmailMessages;
