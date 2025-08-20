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
    const { channelId: inputChannelId, channelName } = params;
    if (!inputChannelId && !channelName) {
      throw Error("Either channelId or channelName must be provided");
    }

    let channelId = inputChannelId;
    if (!channelId) {
      const allChannels = await getSlackChannels(client);
      channelId = allChannels.find(channel => channel.name == channelName)?.id;
    }

    if (!channelId) {
      throw Error(`Channel with name ${channelName} not found`);
    }

    await client.conversations.join({ channel: channelId });

    const result = await client.conversations.archive({ channel: channelId });
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
