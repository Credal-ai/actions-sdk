import { microsoftMessageTeamsChatDefinition } from "../../autogen/templates";
import {
  AuthParamsType,
  microsoftMessageTeamsChatFunction,
  microsoftMessageTeamsChatOutputType,
  microsoftMessageTeamsChatParamsType,
} from "../../autogen/types";

import { getGraphClient } from "./utils";

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

  let client = undefined;
  try {
    client = await getGraphClient(authParams, microsoftMessageTeamsChatDefinition.scopes.join(" "));
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    const response = await client.api(`/chats/${chatId}/messages`).post({
      body: {
        content: message,
      },
    });
    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Error sending message: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }
};

export default sendMessageToTeamsChat;
