import { WebClient } from "@slack/web-api";
import type {
  slackSendMessageFunction,
  slackSendMessageOutputType,
  slackSendMessageParamsType,
  AuthParamsType,
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
  return;
};

export default sendMessage;
