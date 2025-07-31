import type {
  AuthParamsType,
  microsoftMessageTeamsChatFunction,
  microsoftMessageTeamsChatOutputType,
  microsoftMessageTeamsChatParamsType,
} from "../../autogen/types.js";

import { getGraphClient } from "./utils.js";

const sendMessageToTeamsChat: microsoftMessageTeamsChatFunction = async ({
  params,
  authParams,
}: {
  params: microsoftMessageTeamsChatParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftMessageTeamsChatOutputType> => {
  const { chatId, message } = params;

  let client = undefined;
  try {
    client = await getGraphClient(authParams,);
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
