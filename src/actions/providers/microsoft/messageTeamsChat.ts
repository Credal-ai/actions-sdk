import {
  AuthParamsType,
  microsoftMessageTeamsChatFunction,
  microsoftMessageTeamsChatOutputType,
  microsoftMessageTeamsChatParamsType,
} from "../../autogen/types";

import { sendMessage } from "./utils";

const sendMessageToTeamsChat: microsoftMessageTeamsChatFunction = async ({
  params,
  authParams,
}: {
  params: microsoftMessageTeamsChatParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftMessageTeamsChatOutputType> => {
  const { chatId, message } = params;

  if (!chatId) {
    return {
      success: false,
      error: "Chat ID is required to send a message",
    };
  }

  if (!message) {
    return {
      success: false,
      error: "Message content is required to send a message",
    };
  }

  try {
    const messageId = await sendMessage(`/chats/${chatId}/messages`, message, authParams);
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

export default sendMessageToTeamsChat;
