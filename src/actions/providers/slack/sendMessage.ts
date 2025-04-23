import { WebClient } from "@slack/web-api";
import {
  type slackSendMessageFunction,
  type slackSendMessageOutputType,
  type slackSendMessageParamsType,
  type AuthParamsType,
  slackSendMessageOutputSchema,
} from "../../autogen/types";
import { getSlackChannels } from "./helpers";

const sendMessage: slackSendMessageFunction = async ({
  params,
  authParams,
}: {
  params: slackSendMessageParamsType;
  authParams: AuthParamsType;
}): Promise<slackSendMessageOutputType> => {
  const client = new WebClient(authParams.authToken!);
  const { channelName, message } = params;

  const allChannels = await getSlackChannels(client);
  const channel = allChannels.find(channel => channel.name == channelName);

  if (!channel || !channel.id) {
    throw Error(`Channel with name ${channelName} not found`);
  }

  try {
    await client.chat.postMessage({
      channel: channel.id,
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
