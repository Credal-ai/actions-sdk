import { WebClient } from "@slack/web-api";
import {
  type slackUserSearchSlackFunction,
  type slackUserSearchSlackOutputType,
  type slackUserSearchSlackParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/* ===================== Public Types ===================== */

export type TimeRange = "latest" | "today" | "yesterday" | "last_7d" | "last_30d" | "all";

export interface SlackSearchMessage {
  channelId: string;
  ts: string;
  text?: string;
  userId?: string;
  permalink?: string;
  /** If thread: full thread (root first). If not thread: small context window around the hit. */
  context?: Array<{ ts: string; text?: string; userId?: string }>;
}

/* ===================== Minimal Slack Shapes ===================== */

interface SlackMessage {
  ts?: string;
  text?: string;
  user?: string;
  thread_ts?: string;
}

/* ===================== Helpers ===================== */

function normalizeChannelOperand(ch: string): string {
  const s = ch.trim();
  if (/^[CGD][A-Z0-9]/i.test(s)) return s;
  return s.replace(/^#/, "");
}

function timeFilter(range?: TimeRange): string {
  switch (range) {
    case "today":
      return "after:today";
    case "yesterday":
      return "after:yesterday";
    case "last_7d":
      return "after:7 days ago";
    case "last_30d":
      return "after:30 days ago";
    default:
      return "";
  }
}

async function lookupUserIdsByEmail(client: WebClient, emails: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of emails) {
    const email = raw.trim();
    if (!email) continue;
    const res = await client.users.lookupByEmail({ email });
    const id = res.user?.id;
    if (id) ids.push(id);
  }
  return ids;
}

async function getMPIMName(client: WebClient, userIds: string[]): Promise<string> {
  const res = await client.conversations.open({ users: userIds.join(",") });
  const id = res.channel?.id;
  if (!id) throw new Error("Failed to open conversation for provided users.");
  const info = await client.conversations.info({ channel: id });
  if (!info.channel?.name) throw new Error("Failed to open conversation for provided users.");
  return info.channel.name;
}

async function getPermalink(client: WebClient, channel: string, ts: string): Promise<string | undefined> {
  try {
    const res = await client.chat.getPermalink({ channel, message_ts: ts });
    return res.permalink;
  } catch {
    return undefined;
  }
}

async function fetchOneMessage(client: WebClient, channel: string, ts: string): Promise<SlackMessage | undefined> {
  const r = await client.conversations.history({
    channel,
    latest: ts,
    inclusive: true,
    limit: 1,
  });
  return (r.messages && r.messages[0]) || undefined;
}

async function fetchThread(client: WebClient, channel: string, threadTs: string): Promise<SlackMessage[]> {
  const r = await client.conversations.replies({
    channel,
    ts: threadTs,
    limit: 50,
  });
  return r.messages ?? [];
}

async function fetchContextWindow(client: WebClient, channel: string, ts: string): Promise<SlackMessage[]> {
  const out: SlackMessage[] = [];
  const anchor = await fetchOneMessage(client, channel, ts);
  if (!anchor) return out;

  const beforeRes = await client.conversations.history({
    channel,
    latest: ts,
    inclusive: false,
    limit: 4,
  });
  out.push(...(beforeRes.messages ?? []).reverse());

  out.push(anchor);

  const afterRes = await client.conversations.history({
    channel,
    oldest: ts,
    inclusive: false,
    limit: 5,
  });
  out.push(...(afterRes.messages ?? []));

  return out;
}

/* ===================== Main Export ===================== */

const searchSlack: slackUserSearchSlackFunction = async ({
  params,
  authParams,
}: {
  params: slackUserSearchSlackParamsType;
  authParams: AuthParamsType;
}): Promise<slackUserSearchSlackOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const client = new WebClient(authParams.authToken);
  const { emails, channel, topic, timeRange, limit } = params;

  const parts: string[] = [];

  if (emails?.length) {
    const userIds = await lookupUserIdsByEmail(client, emails);
    const {user_id: myUserId } = await client.auth.test();

    if (!myUserId) throw new Error("Failed to get my user ID.");

    const userIdsWithoutMe = userIds.filter(id => id !== myUserId);

    if (userIdsWithoutMe.length === 0) throw new Error("No users resolved from emails.");
    if (userIdsWithoutMe.length == 1) {
      parts.push(`in:<@${userIdsWithoutMe[0]}>`);
    } else {
      const convoName = await getMPIMName(client, userIdsWithoutMe);
      parts.push(`in:${convoName}`);
    }
  } else if (channel) {
    parts.push(`in:${normalizeChannelOperand(channel)}`);
  }

  if (topic && topic.trim()) parts.push(topic.trim());
  const tf = timeFilter(timeRange);
  if (tf) parts.push(tf);

  const query = parts.join(" ").trim();
  if (!query) throw new Error("No query built — provide emails, channel, or topic.");

  const count = Math.max(1, Math.min(100, limit));
  const searchRes = await client.search.messages({ query, count, highlight: true });
  const matches = searchRes.messages?.matches ?? [];

  const hits = matches.slice(0, limit).map(m => ({
    channelId: m.channel?.id || m.channel?.name || "",
    ts: m.ts,
    text: m.text,
    userId: m.user,
  }));

  const results: SlackSearchMessage[] = [];
  for (const h of hits) {
    if (!h.ts) continue;
    try {
      const anchor = await fetchOneMessage(client, h.channelId, h.ts);
      const rootTs = anchor?.thread_ts || h.ts;

      if (anchor?.thread_ts) {
        const thread = await fetchThread(client, h.channelId, rootTs);
        const normalizedThreads = [];
        for (const t of thread) {
          if (!t.ts) continue;
          normalizedThreads.push({ ts: t.ts, text: t.text, userId: t.user });
        }
        results.push({
          channelId: h.channelId,
          ts: rootTs,
          text: anchor.text ?? h.text,
          userId: anchor.user ?? h.userId,
          context: normalizedThreads,
          permalink: await getPermalink(client, h.channelId, rootTs),
        });
      } else {
        const ctx = await fetchContextWindow(client, h.channelId, h.ts);
        const normalizedThreads = [];
        for (const t of ctx) {
          if (!t.ts) continue;
          normalizedThreads.push({ ts: t.ts, text: t.text, userId: t.user });
        }
        results.push({
          channelId: h.channelId,
          ts: h.ts,
          text: anchor?.text ?? h.text,
          userId: anchor?.user ?? h.userId,
          context: normalizedThreads,
          permalink: await getPermalink(client, h.channelId, h.ts),
        });
      }
    } catch {
      results.push({
        channelId: h.channelId,
        ts: h.ts,
        text: h.text,
        userId: h.userId,
        permalink: await getPermalink(client, h.channelId, h.ts),
      });
    }
  }

  results.sort((a, b) => Number(b.ts) - Number(a.ts));
  return { query, results };
};

export default searchSlack;
