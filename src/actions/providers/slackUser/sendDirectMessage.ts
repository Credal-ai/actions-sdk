import { WebClient } from "@slack/web-api";
import {
  type slackUserSendDirectMessageFunction,
  type slackUserSendDirectMessageOutputType,
  type slackUserSendDirectMessageParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const sendDirectMessage: slackUserSendDirectMessageFunction = async ({
  params,
  authParams,
}: {
  params: slackUserSendDirectMessageParamsType;
  authParams: AuthParamsType;
}): Promise<slackUserSendDirectMessageOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { userEmail, message } = params;
  const client = new WebClient(authParams.authToken);

  // Look up user by email
  const userResponse = await client.users.lookupByEmail({ email: userEmail });
  if (!userResponse.user?.id) {
    throw new Error(`Target user not found for email: ${userEmail}`);
  }
  const userId = userResponse.user.id;

  // Open DM conversation with user
  const conversationResponse = await client.conversations.open({ users: userId });
  if (!conversationResponse.channel?.id) {
    throw new Error("Failed to open DM conversation");
  }
  const channelId = conversationResponse.channel.id;

  // Send message - try mrkdwn blocks first, fall back to plain text
  try {
    const response = await client.chat.postMessage({
      channel: channelId,
      text: message,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message,
          },
        },
      ],
    });
    return {
      channelId,
      messageId: response.ts!,
    };
  } catch {
    const response = await client.chat.postMessage({
      channel: channelId,
      text: message,
    });
    return {
      channelId,
      messageId: response.ts!,
    };
  }
};

export default sendDirectMessage;
