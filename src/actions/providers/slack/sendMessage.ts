import { WebClient } from "@slack/web-api";
import {
  type slackSendMessageFunction,
  type slackSendMessageOutputType,
  type slackSendMessageParamsType,
  type AuthParamsType,
  slackSendMessageOutputSchema,
} from "../../autogen/types.js";
import { getSlackChannels } from "./helpers.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const sendMessage: slackSendMessageFunction = async ({
  params,
  authParams,
}: {
  params: slackSendMessageParamsType;
  authParams: AuthParamsType;
}): Promise<slackSendMessageOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const { channelId: inputChannelId, channelName, message } = params;
  if (!inputChannelId && !channelName) {
    throw Error("Either channelId or channelName must be provided");
  }

  const client = new WebClient(authParams.authToken);

  let channelId = inputChannelId;
  if (!channelId) {
    const allChannels = await getSlackChannels(client);
    channelId = allChannels.find(channel => channel.name == channelName)?.id;
  }
  if (!channelId) {
    throw Error(`Channel with name ${channelName} not found`);
  }

  try {
    // First try sending as Markdown blocks (mrkdwn)
    await client.chat.postMessage({
      channel: channelId,
      text: message, // Fallback text for notifications/clients that don't render blocks
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
  } catch {
    // On any error, retry once with plain text only (no blocks)
    try {
      await client.chat.postMessage({
        channel: channelId,
        text: message,
      });
      return slackSendMessageOutputSchema.parse({ success: true });
    } catch (retryError) {
      return slackSendMessageOutputSchema.parse({
        success: false,
        error: retryError instanceof Error ? retryError.message : "Unknown error after retrying sending as plain text",
      });
    }
  }
};

export default sendMessage;
