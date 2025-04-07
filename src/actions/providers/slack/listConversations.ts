import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackListConversationsFunction,
  slackListConversationsOutputType,
  slackListConversationsParamsType,
} from "../../autogen/types";
import type { ChannelWithId } from "./helpers";
import { getSlackChannels } from "./helpers";

type ChannelWithIdTopicNamePurpose = ChannelWithId & { topic: string; name: string; purpose: string };

const slackListConversations: slackListConversationsFunction = async ({
  authParams,
}: {
  params: slackListConversationsParamsType;
  authParams: AuthParamsType;
}): Promise<slackListConversationsOutputType> => {
  const client = new WebClient(authParams.authToken!);
  try {
    const allChannels = await getSlackChannels(client);

    const filteredChannels: ChannelWithIdTopicNamePurpose[] = [];
    for (const channel of allChannels) {
      if (channel.name && channel.topic && channel.topic.value && channel.purpose && channel.purpose.value) {
        const purpose = channel.purpose.value;
        const topic = channel.topic.value;
        const name = channel.name;
        filteredChannels.push({ ...channel, purpose, topic, name });
      }
    }

    return {
      channels: filteredChannels,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Enhance error with more context
      throw new Error(`Failed to list Slack conversations: ${error.message}`);
    } else {
      throw error;
    }
  }
};

export default slackListConversations;
