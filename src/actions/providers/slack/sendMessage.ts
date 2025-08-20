import { WebClient } from "@slack/web-api";
import {
  type slackSendMessageFunction,
  type slackSendMessageOutputType,
  type slackSendMessageParamsType,
  type AuthParamsType,
  slackSendMessageOutputSchema,
} from "../../autogen/types.js";
import { getSlackChannels } from "./helpers.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const sendMessage: slackSendMessageFunction = async ({
  params,
  authParams,
}: {
  params: slackSendMessageParamsType;
  authParams: AuthParamsType;
}): Promise<slackSendMessageOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { channelId: inputChannelId, channelName, message } = params;
  if (!inputChannelId && !channelName) {
    throw Error("Either channelId or channelName must be provided");
  }

  const client = new WebClient(authParams.authToken);

  let channelId = inputChannelId;
  if (!channelId) {
    const allChannels = await getSlackChannels(client);
    channelId = allChannels.find(channel => channel.name == channelName)?.id;
  }
  if (!channelId) {
    throw Error(`Channel with name ${channelName} not found`);
  }

  try {
    await client.chat.postMessage({
      channel: channelId,
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
    return slackSendMessageOutputSchema.parse({
      success: true,
    });
  } catch (error) {
    return slackSendMessageOutputSchema.parse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default sendMessage;
