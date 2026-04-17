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

  const { channelId: inputChannelId, channelName, message, unfurlLinks, threadTs, replyBroadcast } = params;
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

  const baseArgs = {
    channel: channelId!,
    text: message,
    unfurl_links: unfurlLinks,
  };
  const messageBlocks = [
    {
      type: "section" as const,
      text: {
        type: "mrkdwn" as const,
        text: message,
      },
    },
  ];

  const postAsBlocks = () =>
    client.chat.postMessage(
      threadTs
        ? replyBroadcast
          ? {
              ...baseArgs,
              thread_ts: threadTs,
              reply_broadcast: true,
              blocks: messageBlocks,
            }
          : {
              ...baseArgs,
              thread_ts: threadTs,
              blocks: messageBlocks,
            }
        : {
            ...baseArgs,
            blocks: messageBlocks,
          },
    );

  const postAsPlainText = () =>
    client.chat.postMessage(
      threadTs
        ? replyBroadcast
          ? { ...baseArgs, thread_ts: threadTs, reply_broadcast: true }
          : { ...baseArgs, thread_ts: threadTs }
        : baseArgs,
    );

  const buildSuccess = async (result: Awaited<ReturnType<typeof postAsBlocks>>) => {
    const ts = result.ts;
    const resolvedChannelId = result.channel ?? channelId!;

    let permalink: string | undefined;
    if (ts) {
      try {
        const permalinkResult = await client.chat.getPermalink({
          channel: resolvedChannelId,
          message_ts: ts,
        });
        permalink = permalinkResult.permalink;
      } catch {
        // Permalink fetch failed, but the message was sent successfully
      }
    }

    return slackSendMessageOutputSchema.parse({
      success: true,
      channelId: resolvedChannelId,
      timestamp: ts,
      threadTs: threadTs,
      permalink,
    });
  };

  try {
    const result = await postAsBlocks();
    return await buildSuccess(result);
  } catch {
    try {
      const result = await postAsPlainText();
      return await buildSuccess(result);
    } catch (retryError) {
      return slackSendMessageOutputSchema.parse({
        success: false,
        error: retryError instanceof Error ? retryError.message : "Unknown error after retrying sending as plain text",
      });
    }
  }
};

export default sendMessage;
