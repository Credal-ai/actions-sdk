import { RateLimiter } from "limiter";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getEmailContent, type GmailMessage } from "../google-oauth/utils/decodeMessage.js";
import type {
  AuthParamsType,
  googlemailSearchGmailMessagesFunction,
  googlemailSearchGmailMessagesOutputType,
  googlemailSearchGmailMessagesParamsType,
} from "../../autogen/types.js";

const MAX_EMAIL_CONTENTS_FETCHED = 50;
const DEFAULT_EMAIL_CONTENTS_FETCHED = 25;
const MAX_RESULTS_PER_REQUEST = 100;
const MAX_EMAILS_FETCHED_CONCURRENTLY = 5;

const limiter = new RateLimiter({ tokensPerInterval: MAX_EMAILS_FETCHED_CONCURRENTLY, interval: "second" });

function cleanAndTruncateEmail(text: string, maxLength = 2000): string {
  if (!text) return "";

  // Remove quoted replies (naive)
  text = text.replace(/^>.*$/gm, "");

  // Remove signatures
  const signatureMarkers = ["\nBest", "\nRegards", "\nThanks", "\nSincerely"];
  for (const marker of signatureMarkers) {
    const index = text.indexOf(marker);
    if (index !== -1) {
      text = text.slice(0, index).trim();
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
  const max = Math.min(maxResults ?? DEFAULT_EMAIL_CONTENTS_FETCHED, MAX_EMAIL_CONTENTS_FETCHED);

  const allMessages = [];
  const errorMessages: string[] = [];
  let pageToken: string | undefined;
  let fetched = 0;

  try {
    while (fetched < max) {
      const url =
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "") +
        `&maxResults=${Math.min(MAX_RESULTS_PER_REQUEST, max - fetched)}`;

      const listRes = await axiosClient.get(url, {
        headers: { Authorization: `Bearer ${authParams.authToken}` },
      });

      const { messages: messageList = [], nextPageToken } = listRes.data;
      if (!Array.isArray(messageList) || messageList.length === 0) break;

      const batch = messageList.slice(0, max - allMessages.length);

      const results = await Promise.all(
        batch.map(async msg => {
          try {
            await limiter.removeTokens(1);

            const msgRes = await axiosClient.get<GmailMessage>(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
              {
                headers: { Authorization: `Bearer ${authParams.authToken}` },
                validateStatus: () => true,
              },
            );
            const { id, threadId, snippet, labelIds, internalDate, payload } = msgRes.data;
            // Find the "From" header
            const fromHeader = payload.headers.find(h => h.name.toLowerCase() === "from");
            const toHeader = payload.headers.find(h => h.name.toLowerCase() === "to");
            const subjectHeader = payload.headers.find(h => h.name.toLowerCase() === "subject");
            const ccHeader = payload.headers.find(h => h.name.toLowerCase() === "cc");
            const bccHeader = payload.headers.find(h => h.name.toLowerCase() === "bcc");
            const rawBody = getEmailContent(msgRes.data) || "";
            const emailBody = cleanAndTruncateEmail(rawBody);

            return {
              id,
              threadId,
              snippet,
              labelIds,
              internalDate,
              emailBody,
              from: fromHeader?.value,
              to: toHeader?.value,
              subject: subjectHeader?.value,
              cc: ccHeader?.value,
              bcc: bccHeader?.value,
            };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch message details";
            errorMessages.push(errorMessage);
            return {
              id: msg.id,
              threadId: "",
              snippet: "",
              labelIds: [],
              internalDate: "",
              emailBody: "",
              error: errorMessage,
              from: "",
              to: "",
              subject: "",
              cc: "",
              bcc: "",
            };
          }
        }),
      );

      allMessages.push(...results);
      fetched = allMessages.length;
      if (!nextPageToken || fetched >= max) break;
      pageToken = nextPageToken;
    }

    return {
      success: errorMessages.length === 0,
      messages: allMessages,
      error: errorMessages.join("; "),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error searching Gmail",
      messages: [],
    };
  }
};

export default searchGmailMessages;
