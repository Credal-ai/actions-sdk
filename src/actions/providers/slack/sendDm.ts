import { WebClient } from "@slack/web-api";

import {
  type slackSendDmFunction,
  type slackSendDmOutputType,
  type slackSendDmParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Sends a direct message to a user on Slack.
 *
 * This action:
 * 1. Looks up the user by email using users.lookupByEmail
 * 2. Opens a DM channel with conversations.open (or uses existing)
 * 3. Posts the message using chat.postMessage
 */
const sendDm: slackSendDmFunction = async ({
  params,
  authParams,
}: {
  params: slackSendDmParamsType;
  authParams: AuthParamsType;
}): Promise<slackSendDmOutputType> => {
  if (!authParams.authToken) throw new Error(MISSING_AUTH_TOKEN);

  const client = new WebClient(authParams.authToken);
  const { email, message } = params;

  try {
    // Step 1: Look up user by email
    const userLookup = await client.users.lookupByEmail({ email });
    const userId = userLookup.user?.id;

    if (!userId) {
      return {
        success: false,
        error: `User not found with email: ${email}`,
      };
    }

    // Step 2: Open DM conversation (or get existing one)
    const conversationOpen = await client.conversations.open({
      users: userId,
    });

    const channelId = conversationOpen.channel?.id;

    if (!channelId) {
      return {
        success: false,
        error: "Failed to open DM conversation",
      };
    }

    // Step 3: Send the message
    const result = await client.chat.postMessage({
      channel: channelId,
      text: message,
    });

    if (!result.ok) {
      return {
        success: false,
        error: result.error || "Failed to send message",
      };
    }

    // Get permalink for the sent message
    let permalink: string | undefined;
    if (result.ts) {
      try {
        const permalinkResult = await client.chat.getPermalink({
          channel: channelId,
          message_ts: result.ts,
        });
        permalink = permalinkResult.permalink;
      } catch {
        // Permalink fetch failed, but message was sent successfully
      }
    }

    return {
      success: true,
      channelId,
      timestamp: result.ts,
      permalink,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default sendDm;
