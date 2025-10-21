import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackGetChannelMessagesFunction,
  slackGetChannelMessagesOutputType,
  slackGetChannelMessagesParamsType,
} from "../../autogen/types.js";
import { getSlackChannels } from "./helpers.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import {
  extractMessageText,
  transformToSlackMessage,
  simplifyFile,
  removeRedundantFields,
} from "./messageTransformers.js";

type SlackMessage = {
  type: string;
  subtype?: string;
  text: string;
  extractedText?: string; // Extracted text from blocks/attachments
  ts: string;
  user: string;
  thread_ts?: string;
  reply_count?: number;
  [key: string]: unknown;
};

const getChannelMessages: slackGetChannelMessagesFunction = async ({
  params,
  authParams,
}: {
  params: slackGetChannelMessagesParamsType;
  authParams: AuthParamsType;
}): Promise<slackGetChannelMessagesOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const client = new WebClient(authParams.authToken);
  const { channelId: inputChannelId, channelName, oldest, latest, limit, cursor, includeThreadReplies } = params;
  if (!inputChannelId && !channelName) {
    throw Error("Either channelId or channelName must be provided");
  }

  let channelId = inputChannelId;
  if (!channelId) {
    const allChannels = await getSlackChannels(client);
    const channel = allChannels.find(channel => channel.name === channelName);

    if (!channel || !channel.id) {
      throw Error(`Channel with name ${channelName} not found`);
    }
    channelId = channel.id;
  }

  const messages = await client.conversations.history({
    channel: channelId,
    oldest: oldest,
    latest: latest,
    limit: limit,
    cursor: cursor,
  });
  if (!messages.ok) {
    throw Error(`Failed to fetch messages from channel ${channelName}, channelId: ${channelId}`);
  }

  let processedMessages = messages.messages as SlackMessage[];

  // Fetch thread replies if requested
  if (includeThreadReplies) {
    processedMessages = await Promise.all(
      processedMessages.map(async msg => {
        // If message has replies, fetch them
        if (msg.reply_count && msg.reply_count > 0 && msg.ts) {
          try {
            const threadReplies = await client.conversations.replies({
              channel: channelId!,
              ts: msg.ts,
              limit: 20,
            });

            if (threadReplies.ok && threadReplies.messages) {
              // Skip the first message (it's the parent) and process replies
              const replies = threadReplies.messages.slice(1) as Record<string, unknown>[];

              // Process each reply: extract text, simplify files, simplify reactions, remove redundant fields
              msg.replies = replies.map(reply => {
                // Extract text from reply
                const replyTransformed = transformToSlackMessage(reply);
                const replyExtractedText = extractMessageText(replyTransformed);
                if (replyExtractedText) {
                  reply.extractedText = replyExtractedText;
                }

                // Simplify files in reply
                if (reply.files && Array.isArray(reply.files)) {
                  reply.files = (reply.files as Record<string, unknown>[]).map((file: Record<string, unknown>) =>
                    simplifyFile(file),
                  );
                }

                // Simplify reactions in reply
                if (reply.reactions && Array.isArray(reply.reactions)) {
                  reply.reactions = (reply.reactions as Record<string, unknown>[]).map(
                    (reaction: Record<string, unknown>) => ({
                      name: reaction.name,
                      count: reaction.count,
                    }),
                  );
                }

                // Remove redundant fields from reply
                removeRedundantFields(reply);

                return reply;
              });
            }
          } catch (error) {
            console.error(`Failed to fetch replies for message ${msg.ts}:`, error);
          }
        }
        return msg;
      }),
    );
  }

  // Transform and enrich messages with extracted text
  processedMessages = processedMessages.map(msg => {
    // Transform to structured message format
    const transformed = transformToSlackMessage(msg as Record<string, unknown>);

    // Extract readable text from blocks/attachments
    const extractedText = extractMessageText(transformed);
    if (extractedText) {
      msg.extractedText = extractedText;
    }

    // Simplify files first (to extract highest quality thumb before removing thumb fields)
    if (msg.files && Array.isArray(msg.files)) {
      msg.files = msg.files.map(file => simplifyFile(file as Record<string, unknown>));
    }

    // Simplify reactions (remove users array, keep just name and count)
    if (msg.reactions && Array.isArray(msg.reactions)) {
      msg.reactions = (msg.reactions as Record<string, unknown>[]).map((reaction: Record<string, unknown>) => ({
        name: reaction.name,
        count: reaction.count,
      }));
    }

    // Process root field for thread_broadcast messages
    if (msg.root && typeof msg.root === "object") {
      const root = msg.root as Record<string, unknown>;

      // Simplify files in root
      if (root.files && Array.isArray(root.files)) {
        root.files = (root.files as Record<string, unknown>[]).map((file: Record<string, unknown>) =>
          simplifyFile(file),
        );
      }

      // Simplify reactions in root
      if (root.reactions && Array.isArray(root.reactions)) {
        root.reactions = (root.reactions as Record<string, unknown>[]).map((reaction: Record<string, unknown>) => ({
          name: reaction.name,
          count: reaction.count,
        }));
      }

      // Remove redundant fields from root
      removeRedundantFields(root);
    }

    // Remove all redundant fields recursively from the entire message
    // Note: replies are already processed when fetched if includeThreadReplies is true
    removeRedundantFields(msg as unknown as Record<string, unknown>);

    return msg;
  });

  return {
    messages: processedMessages as SlackMessage[],
    hasMore: messages.has_more,
    nextCursor: messages.response_metadata?.next_cursor,
  };
};

export default getChannelMessages;
