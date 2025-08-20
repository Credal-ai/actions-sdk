import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackCreateChannelFunction,
  slackCreateChannelParamsType,
  slackCreateChannelOutputType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const createChannel: slackCreateChannelFunction = async ({
  params,
  authParams,
}: {
  params: slackCreateChannelParamsType;
  authParams: AuthParamsType;
}): Promise<slackCreateChannelOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const userEmail = authParams.userEmail;

  try {
    const client = new WebClient(authParams.authToken);
    const { channelName, isPrivate } = params;
    const result = await client.conversations.create({
      name: channelName,
      is_private: !!isPrivate,
    });
    const { ok, channel, error } = result;

    if (!ok || !channel?.id) {
      return {
        success: false,
        error: error || "Unknown error creating channel",
      };
    }

    if (!userEmail) {
      return {
        success: false,
        error: "userEmail must be provided in authParams to invite user to private channel",
      };
    }
    const userID = await client.users.lookupByEmail({ email: userEmail });
    if (!userID.user?.id) {
      return {
        success: false,
        error: `Could not find user with email ${userEmail}`,
      };
    }
    // Add the user who asked to create the channel to the channel
    await client.conversations.invite({
      channel: channel.id,
      users: userID.user.id,
    });

    return {
      success: true,
      channelId: channel.id,
      channelUrl: `https://slack.com/app_redirect?channel=${channel.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating channel",
    };
  }
};

export default createChannel;
