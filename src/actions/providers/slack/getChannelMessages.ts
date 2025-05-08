import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackGetChannelMessagesFunction,
  slackGetChannelMessagesOutputType,
  slackGetChannelMessagesParamsType,
} from "../../autogen/types";
import { getSlackChannels } from "./helpers";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

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
  const { channelName, oldest } = params;

  const allChannels = await getSlackChannels(client);
  const channel = allChannels.find(channel => channel.name === channelName && channel.is_private === false);

  if (!channel || !channel.id) {
    throw Error(`Channel with name ${channelName} not found`);
  }

  const messages = await client.conversations.history({
    channel: channel.id,
    oldest: oldest,
  });
  if (!messages.ok) {
    throw Error(`Failed to fetch messages from channel ${channel.name}`);
  }

  return {
    messages: messages.messages as SlackMessage[],
  };
};

export default getChannelMessages;
