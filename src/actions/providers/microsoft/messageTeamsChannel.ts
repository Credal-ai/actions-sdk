import { microsoftMessageTeamsChannelDefinition } from "../../autogen/templates.js";
import type {
  AuthParamsType,
  microsoftMessageTeamsChannelFunction,
  microsoftMessageTeamsChannelOutputType,
  microsoftMessageTeamsChannelParamsType,
} from "../../autogen/types.js";

import { getGraphClient } from "./utils.js";

const sendMessageToTeamsChannel: microsoftMessageTeamsChannelFunction = async ({
  params,
  authParams,
}: {
  params: microsoftMessageTeamsChannelParamsType;
  authParams: AuthParamsType;
}): Promise<microsoftMessageTeamsChannelOutputType> => {
  const { channelId, teamId, message } = params;

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
