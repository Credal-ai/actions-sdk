import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackGetChannelMessagesFunction,
  slackGetChannelMessagesOutputType,
  slackGetChannelMessagesParamsType,
} from "../../autogen/types.js";
import { getSlackChannels } from "./helpers.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

type SlackMessage = {
  type: string;
  subtype?: string;
  text: string;
  ts: string;
  user: string;
};

const getChannelMessages: slackGetChannelMessagesFunction = async ({
  params,
  authParams,
}: {
  params: slackGetChannelMessagesParamsType;
  authParams: AuthParamsType;
}): Promise<slackGetChannelMessagesOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const client = new WebClient(authParams.authToken);
  const { channelId: inputChannelId, channelName, oldest } = params;
  if (!inputChannelId && !channelName) {
    throw Error("Either channelId or channelName must be provided");
  }

  let channelId = inputChannelId;
  if (!channelId) {
    const allChannels = await getSlackChannels(client);
    const channel = allChannels.find(channel => channel.name === channelName && channel.is_private === false);

    if (!channel || !channel.id) {
      throw Error(`Channel with name ${channelName} not found`);
    }
    channelId = channel.id;
  }

  const messages = await client.conversations.history({
    channel: channelId,
    oldest: oldest,
  });
  if (!messages.ok) {
    throw Error(`Failed to fetch messages from channel ${channelName}, channelId: ${channelId}`);
  }

  return {
    messages: messages.messages as SlackMessage[],
  };
};

export default getChannelMessages;
