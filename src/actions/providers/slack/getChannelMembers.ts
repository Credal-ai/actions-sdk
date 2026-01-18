import { WebClient } from "@slack/web-api";
import type {
  AuthParamsType,
  slackGetChannelMembersFunction,
  slackGetChannelMembersOutputType,
  slackGetChannelMembersParamsType,
} from "../../autogen/types.js";
import { getSlackChannels } from "./helpers.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const getChannelMembers: slackGetChannelMembersFunction = async ({
  params,
  authParams,
}: {
  params: slackGetChannelMembersParamsType;
  authParams: AuthParamsType;
}): Promise<slackGetChannelMembersOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const client = new WebClient(authParams.authToken);
  const { channelId: inputChannelId, channelName } = params;
  if (!inputChannelId && !channelName) {
    throw Error("Either channelId or channelName must be provided");
  }

  let channelId = inputChannelId;
  if (!channelId) {
    const allChannels = await getSlackChannels(client);
    const channel = allChannels.find(channel => channel.name === channelName);

    if (!channel || !channel.id) {
      throw Error(`Channel with name ${channelName} not found`);
    }
    channelId = channel.id;
  }

  const response = await client.conversations.members({
    channel: channelId,
  });

  if (!response.ok) {
    throw Error(`Failed to fetch members from channel ${channelName}, channelId: ${channelId}`);
  }

  const memberIds = response.members || [];

  // Fetch user information for each member
  const members = await Promise.all(
    memberIds.map(async userId => {
      try {
        const userInfo = await client.users.info({ user: userId });
        if (userInfo.ok && userInfo.user) {
          const user = userInfo.user;
          return {
            id: user.id || userId,
            name: user.real_name || user.name || "",
            email: user.profile?.email || "",
          };
        }
      } catch (error) {
        console.error(`Failed to fetch user info for ${userId}:`, error);
      }
      // Return basic info if user fetch fails
      return {
        id: userId,
        name: "",
        email: "",
      };
    }),
  );

  return {
    success: true,
    members,
  };
};

export default getChannelMembers;
