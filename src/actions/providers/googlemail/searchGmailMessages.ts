import { RateLimiter } from "limiter";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getEmailContent, type GmailMessage } from "../google-oauth/utils/decodeMessage.js";

export interface GmailMessageResult {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  internalDate: string;
  emailBody: string;
  from?: string;
  to?: string;
  subject?: string;
  cc?: string;
  bcc?: string;
  error?: string;
}
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
const DEFAULT_EMAIL_FETCH_TIMEOUT = 5000; // 5 second timeout per email

const limiter = new RateLimiter({ tokensPerInterval: MAX_EMAILS_FETCHED_CONCURRENTLY, interval: "second" });

const QUOTED_REPLY_REGEX = /^>.*$/gm;
const NEWLINE_NORMALIZE_REGEX = /\r\n|\r/g;
const MULTIPLE_NEWLINES_REGEX = /\n{3,}/g;

function cleanAndTruncateEmail(text: string, maxLength = 2000): string {
  if (!text) return "";

  // Remove quoted replies
  text = text.replace(QUOTED_REPLY_REGEX, "");

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
  text = text.replace(NEWLINE_NORMALIZE_REGEX, "\n").replace(MULTIPLE_NEWLINES_REGEX, "\n\n").trim();

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

  const { query, maxResults, timeout } = params;
  const max = Math.min(maxResults ?? DEFAULT_EMAIL_CONTENTS_FETCHED, MAX_EMAIL_CONTENTS_FETCHED);

  const allMessages = [];
  const errorMessages: string[] = [];
  let pageToken: string | undefined;
  let fetched = 0;

  try {
    while (fetched < max) {
      // Calculate the optimal batch size for this request
      const batchSize = Math.min(
        MAX_RESULTS_PER_REQUEST, // API maximum
        max - fetched, // Only fetch what we still need
        MAX_EMAILS_FETCHED_CONCURRENTLY, // Respect concurrency limit
      );

      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${batchSize}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;

      const listRes = await axiosClient.get(url, {
        headers: { Authorization: `Bearer ${authParams.authToken}` },
      });

      const { messages: messageList = [], nextPageToken } = listRes.data;
      if (!Array.isArray(messageList) || messageList.length === 0) break;

      const batch = messageList.slice(0, max - allMessages.length);

      const results = await Promise.allSettled(
        batch.map(async msg => {
          try {
            await limiter.removeTokens(1);

            const msgRes = await axiosClient.get<GmailMessage>(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
              {
                headers: { Authorization: `Bearer ${authParams.authToken}` },
                timeout: timeout ? timeout * 1000 : DEFAULT_EMAIL_FETCH_TIMEOUT,
                validateStatus: () => true,
              },
            );
            const { id, threadId, snippet, labelIds, internalDate, payload } = msgRes.data;

            const headers: Record<string, string> = {};
            for (const header of payload.headers) {
              const lowerName = header.name.toLowerCase();
              if (
                lowerName === "from" ||
                lowerName === "to" ||
                lowerName === "subject" ||
                lowerName === "cc" ||
                lowerName === "bcc"
              ) {
                headers[lowerName] = header.value;
              }
            }

            const rawBody = getEmailContent(msgRes.data) || "";
            const emailBody = cleanAndTruncateEmail(rawBody);

            const message: GmailMessageResult = {
              id,
              threadId,
              snippet,
              labelIds,
              internalDate,
              emailBody,
              from: headers.from,
              to: headers.to,
              subject: headers.subject,
              cc: headers.cc,
              bcc: headers.bcc,
            };
            return message;
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

      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<GmailMessageResult> => r.status === "fulfilled")
        .map(r => r.value);

      const failedResults = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      failedResults.forEach(r => {
        const errorMessage = r.reason instanceof Error ? r.reason.message : "Failed to fetch message details";
        errorMessages.push(errorMessage);
      });

      allMessages.push(...successfulResults);
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
