import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackGetChannelMessagesFunction,
  slackGetChannelMessagesOutputType,
  slackGetChannelMessagesParamsType,
} from "../../autogen/types.js";
import { getSlackChannels } from "./helpers.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

type SlackMessage = {
  type: string;
  subtype?: string;
  text: string;
  ts: string;
  user: string;
  thread_ts?: string;
  reply_count?: number;
  [key: string]: unknown;
};

type SimplifiedFile = {
  id: string;
  created?: number;
  timestamp?: number;
  name?: string;
  title?: string;
  mimetype?: string;
  file_access?: string;
  highest_thumb?: string;
};

// Redundant fields to remove from messages - not useful (fills up context window so we can ditch these)
const REDUNDANT_FIELDS = [
  // Image/media metadata
  "app_icons",
  "image_width",
  "image_height",
  "image_bytes",
  "fallback",
  "is_animated",

  // Message metadata (not content-related)
  "team",
  "client_msg_id",
  "is_locked",
  "subscribed",
  "display_as_bot",
  "upload",

  // Block metadata
  "block_id",
  "unicode", // Emoji unicode values (name is sufficient)

  // File metadata (duplicates or not useful)
  "file_access",
  "filetype", // Redundant with mimetype
  "pretty_type", // Redundant with mimetype
  "thumb_tiny", // Base64 preview, not needed

  // Attachment metadata
  "service_icon", // Icon URLs for link previews
  "from_url", // Duplicate of original_url
];

// Helper to recursively remove blacklisted fields from an object
function removeRedundantFields(obj: Record<string, unknown>): void {
  for (const key of REDUNDANT_FIELDS) {
    delete obj[key];
  }

  // Recursively clean nested objects and arrays
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === "object") {
            removeRedundantFields(item as Record<string, unknown>);
          }
        });
      } else {
        removeRedundantFields(value as Record<string, unknown>);
      }
    }
  }
}

// Helper to get the highest quality thumbnail from a file
function getHighestQualityThumb(file: Record<string, unknown>): string | undefined {
  const thumbSizes = [
    "thumb_1024",
    "thumb_960",
    "thumb_800",
    "thumb_720",
    "thumb_480",
    "thumb_360",
    "thumb_160",
    "thumb_80",
    "thumb_64",
  ];

  for (const size of thumbSizes) {
    const thumb = file[size];
    if (thumb && typeof thumb === "string") {
      return thumb;
    }
  }

  return undefined;
}

// Helper to simplify file objects
function simplifyFile(file: Record<string, unknown>): SimplifiedFile {
  const simplified: SimplifiedFile = {
    id: file.id as string,
    created: file.created as number | undefined,
    timestamp: file.timestamp as number | undefined,
    name: file.name as string | undefined,
    title: file.title as string | undefined,
    mimetype: file.mimetype as string | undefined,
    file_access: file.file_access as string | undefined,
  };

  const highestThumb = getHighestQualityThumb(file);
  if (highestThumb) {
    simplified.highest_thumb = highestThumb;
  }

  return simplified;
}

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
            });

            if (threadReplies.ok && threadReplies.messages) {
              // Skip the first message (it's the parent) and add replies to the message
              msg.replies = threadReplies.messages.slice(1);
            }
          } catch (error) {
            console.error(`Failed to fetch replies for message ${msg.ts}:`, error);
          }
        }
        return msg;
      }),
    );
  }

  // Simplify files and remove unnecessary fields in all messages
  processedMessages = processedMessages.map(msg => {
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

    // Simplify files in thread replies if present
    if (msg.replies && Array.isArray(msg.replies)) {
      msg.replies = (msg.replies as Record<string, unknown>[]).map((reply: Record<string, unknown>) => {
        if (reply.files && Array.isArray(reply.files)) {
          reply.files = (reply.files as Record<string, unknown>[]).map((file: Record<string, unknown>) =>
            simplifyFile(file),
          );
        }
        // Simplify reactions in replies too
        if (reply.reactions && Array.isArray(reply.reactions)) {
          reply.reactions = (reply.reactions as Record<string, unknown>[]).map((reaction: Record<string, unknown>) => ({
            name: reaction.name,
            count: reaction.count,
          }));
        }
        return reply;
      });
    }

    // Remove all blacklisted fields recursively from the entire message
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
