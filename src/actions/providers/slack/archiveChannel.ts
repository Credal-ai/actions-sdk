import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackArchiveChannelFunction,
  slackArchiveChannelParamsType,
  slackArchiveChannelOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

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
    const { channelId } = params;

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
