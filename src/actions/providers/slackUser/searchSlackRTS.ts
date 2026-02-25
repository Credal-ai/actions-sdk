import { WebClient } from "@slack/web-api";

import {
  type slackUserSearchSlackRTSFunction,
  type slackUserSearchSlackRTSOutputType,
  type slackUserSearchSlackRTSParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { normalizeChannelOperand } from "./utils.js";

/* ===================== Types ===================== */

async function resolveSlackUserId(client: WebClient, raw: string): Promise<string | null> {
  const s = raw.trim();
  if (!s) return null;

  try {
    const res = await client.users.lookupByEmail({ email: s });
    if (res.user?.id) return res.user.id;
  } catch {
    // ignore and fall back
  }
  return null;
}

function appendToQuery(query: string, suffix: string): string {
  const q = query.trim();
  const s = suffix.trim();
  if (!q) return s;
  if (!s) return q;
  return `${q} ${s}`;
}

function normalizeUnixSecondsInput(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!Number.isNaN(Number(value))) return value;

  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;
  return String(Math.floor(date.getTime() / 1000));
}

interface AssistantSearchContextResponse {
  ok: boolean;
  results?: {
    messages?: Array<{
      author_user_id: string;
      team_id: string;
      channel_id: string;
      message_ts: string;
      content: string;
      is_author_bot: boolean;
      permalink?: string;
    }>;
    files?: Array<{
      file_id: string;
      title: string;
      permalink?: string;
    }>;
  };
  response_metadata?: {
    next_cursor?: string;
  };
  error?: string;
}

/* ===================== MAIN EXPORT ===================== */

const searchSlackRTS: slackUserSearchSlackRTSFunction = async ({
  params,
  authParams,
}: {
  params: slackUserSearchSlackRTSParamsType;
  authParams: AuthParamsType;
}): Promise<slackUserSearchSlackRTSOutputType> => {
  if (!authParams.authToken) throw new Error(MISSING_AUTH_TOKEN);
  const client = new WebClient(authParams.authToken);

  const {
    query,
    userEmails,
    channelIds,
    channelTypes,
    contentTypes = ["messages", "files", "channels"],
    includeBots = false,
    limit = 20,
    includeContextMessages = true,
    before,
    after,
  } = params;

  if (
    (!query || query === "") &&
    (!userEmails || userEmails.length === 0) &&
    (!channelIds || channelIds.length === 0)
  ) {
    throw new Error("If query is left blank, you must provide at least one userEmail or channelId to filter by.");
  }

  let finalQuery = query ?? "";

  if (userEmails != undefined && userEmails.length > 0) {
    const settled = await Promise.allSettled(userEmails.map((u: string) => resolveSlackUserId(client, u)));
    const fulfilled = settled.filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled");
    const ids = fulfilled.map(r => r.value).filter((id): id is string => Boolean(id));

    if (ids.length > 0) {
      // Slack expects IDs in angle brackets, e.g. from:<@U123> from:<@U456>
      const filter = ids.map(id => `from:<@${id}>`).join(" ");
      finalQuery = appendToQuery(finalQuery, filter);
    }
  }

  if (channelIds != undefined && channelIds.length > 0) {
    const operands = channelIds.map(normalizeChannelOperand).filter((operand): operand is string => Boolean(operand));
    if (operands.length > 0) {
      const filter = operands.map(op => `in:${op}`).join(" ");
      finalQuery = appendToQuery(finalQuery, filter);
    }
  }

  // Build the request parameters for assistant.search.context
  const requestParams: Record<string, unknown> = {
    query: finalQuery,
  };

  // Add optional parameters if provided
  if (!channelTypes || channelTypes.length === 0) {
    // Default is only public channels, which is unhelpful bc many people want to search private channels
    requestParams.channel_types = ["public_channel", "private_channel", "im"];
  } else {
    requestParams.channel_types = channelTypes;
  }

  if (contentTypes && contentTypes.length > 0) {
    requestParams.content_types = contentTypes;
  }

  if (includeBots !== undefined) {
    requestParams.include_bots = includeBots;
  }

  if (limit) {
    requestParams.limit = Math.min(limit, 20); // API max is 20, not handling pagination yet
  }

  if (includeContextMessages !== undefined) {
    requestParams.include_context_messages = includeContextMessages;
  }

  const normalizedBefore = normalizeUnixSecondsInput(before);
  if (normalizedBefore) {
    requestParams.before = normalizedBefore;
  }

  const normalizedAfter = normalizeUnixSecondsInput(after);
  if (normalizedAfter) {
    requestParams.after = normalizedAfter;
  }

  try {
    // Call the assistant.search.context API
    const response = (await client.apiCall(
      "assistant.search.context",
      requestParams,
    )) as AssistantSearchContextResponse;

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error || "Unknown error"}`);
    }

    // Return the response in the expected format
    return {
      ok: response.ok,
      results: {
        messages: response.results?.messages || [],
        files: response.results?.files || [],
      },
    };
  } catch (error) {
    // Handle errors gracefully
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to search Slack using RTS API: ${errorMessage}`, { cause: error });
  }
};

export default searchSlackRTS;
