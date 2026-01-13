import { WebClient } from "@slack/web-api";

import {
  type slackUserSearchSlackRTSFunction,
  type slackUserSearchSlackRTSOutputType,
  type slackUserSearchSlackRTSParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/* ===================== Types ===================== */

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
    channelTypes,
    contentTypes = ["messages", "files", "channels"],
    includeBots = false,
    limit = 20,
    includeContextMessages = true,
    before,
    after,
  } = params;

  // Build the request parameters for assistant.search.context
  const requestParams: Record<string, unknown> = {
    query,
  };

  // Add optional parameters if provided
  if (channelTypes && channelTypes.length > 0) {
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

  if (before) {
    requestParams.before = before;
  }

  if (after) {
    requestParams.after = after;
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
    throw new Error(`Failed to search Slack using RTS API: ${errorMessage}`);
  }
};

export default searchSlackRTS;
