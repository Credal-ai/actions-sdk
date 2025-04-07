import { microsoftMessageTeamsChannelDefinition } from "../../autogen/templates";
import type {
  AuthParamsType,
  microsoftMessageTeamsChannelFunction,
  microsoftMessageTeamsChannelOutputType,
  microsoftMessageTeamsChannelParamsType,
} from "../../autogen/types";

import { getGraphClient } from "./utils";

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

  let client = undefined;
  try {
    client = await getGraphClient(authParams, microsoftMessageTeamsChannelDefinition.scopes.join(" "));
  } catch (error) {
    return {
      success: false,
      error: "Error while authorizing: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }

  try {
    const response = await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post({
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

export default sendMessageToTeamsChannel;
