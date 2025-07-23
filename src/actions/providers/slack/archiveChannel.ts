import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackArchiveChannelFunction,
  slackArchiveChannelParamsType,
  slackArchiveChannelOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getSlackChannels } from "./helpers.js";

const archiveChannel: slackArchiveChannelFunction = async ({
  params,
  authParams,
}: {
  params: slackArchiveChannelParamsType;
  authParams: AuthParamsType;
}): Promise<slackArchiveChannelOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  try {
    const client = new WebClient(authParams.authToken);
    const { channelName } = params;

    const allChannels = await getSlackChannels(client);
    const channel = allChannels.find(channel => channel.name == channelName);

    if (!channel || !channel.id) {
      throw Error(`Channel with name ${channelName} not found`);
    }

    await client.conversations.join({ channel: channel.id });

    const result = await client.conversations.archive({ channel: channel.id });
    if (!result.ok) {
      return {
        success: false,
        error: result.error || "Unknown error archiving channel",
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error archiving channel",
    };
  }
};

export default archiveChannel;
