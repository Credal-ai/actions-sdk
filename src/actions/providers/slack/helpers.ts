import type { ConversationsListResponse, WebClient } from "@slack/web-api";
import type { Channel } from "@slack/web-api/dist/types/response/ConversationsListResponse";

export type ChannelWithId = Channel & { id: string };

export async function getSlackChannels(client: WebClient): Promise<ChannelWithId[]> {
  const limit = 100;
  const allChannels: ChannelWithId[] = [];

  const allChannelsIterable = await client.paginate("conversations.list", {
    exclude_archived: true,
    limit,
  });

  for await (const page of allChannelsIterable as AsyncIterable<ConversationsListResponse>) {
    if (!page.channels) continue; // Not expected
    for (const channel of page.channels) {
      const channelId = channel.id;
      if (channelId) {
        allChannels.push({ ...channel, id: channelId });
      }
    }
  }

  return allChannels;
}
