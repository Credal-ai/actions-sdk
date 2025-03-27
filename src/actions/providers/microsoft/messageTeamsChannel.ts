import {
  AuthParamsType,
  microsoftMessageTeamsChannelFunction,
  microsoftMessageTeamsChannelOutputType,
  microsoftMessageTeamsChannelParamsType,
} from "../../autogen/types";

import { sendMessage } from "./utils";

const sendMessageToTeamsChannel: microsoftMessageTeamsChannelFunction = async ({
  params,
  authParams,
}: {
  params: microsoftMessageTeamsChannelParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftMessageTeamsChannelOutputType> => {
  const { channelId, teamId, message } = params;

  if (!teamId) {
    return {
      success: false,
      error: "Team ID is required to send a message",
    };
  }

  if (!channelId) {
    return { success: false, error: "Channel ID is required to send a message" };
  }

  if (!message) {
    return {
      success: false,
      error: "Message content is required to send a message",
    };
  }

  try {
    const messageId = await sendMessage(`/teams/${teamId}/channels/${channelId}/messages`, message, authParams);
    return {
      success: true,
      messageId: messageId,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default sendMessageToTeamsChannel;
