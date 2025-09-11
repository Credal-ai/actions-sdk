import { WebClient } from "@slack/web-api";
import {
  type slackUserSearchSlackFunction,
  type slackUserSearchSlackOutputType,
  type slackUserSearchSlackParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import pLimit from "p-limit";

const HIT_ENRICH_POOL = 5;
const limitHit = pLimit(HIT_ENRICH_POOL);

/* ===================== Public Types ===================== */

export type TimeRange = "latest" | "today" | "yesterday" | "last_7d" | "last_30d" | "all";

class SlackUserCache {
  private cache: Map<string, { email: string; name: string }>;
  constructor(private client: WebClient) {
    this.cache = new Map<string, { email: string; name: string }>();
    this.client = client;
  }
  async get(id: string): Promise<{ email: string; name: string } | undefined> {
    const result = this.cache.get(id);
    if (result) return result;
    const res = await this.client.users.info({ user: id });
    const u = {
      name: res.user?.profile?.display_name ?? res.user?.real_name ?? "",
      email: res.user?.profile?.email ?? "",
    };
    if (res.user && id && res.user.name) {
      this.cache.set(id, u);
      return u;
    }
    return undefined;
  }

  set(id: string, { email, name }: { email: string; name: string }) {
    this.cache.set(id, { email, name });
  }
}

export interface SlackSearchMessage {
  channelId: string;
  ts: string;
  text?: string;
  userEmail?: string;
  permalink?: string;
  /** If thread: full thread (root first). If not thread: small context window around the hit. */
  context?: Array<{ ts: string; text?: string; userEmail?: string; userName?: string }>;
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


function fmtDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function timeFilter(range?: TimeRange) {
  switch (range) {
    case "today": return "on:today";
    case "yesterday": return "on:yesterday";
    case "last_7d": return `after:${fmtDaysAgo(7)}`;
    case "last_30d": return `after:${fmtDaysAgo(30)}`;
    default: return "";
  }
}

async function lookupUserIdsByEmail(
  client: WebClient,
  emails: string[],
  slackUserCache: SlackUserCache,
): Promise<string[]> {
  const ids: string[] = [];
  const tasks = emails.map(async raw => {
    const email = raw.trim();
    if (!email) return null;
    const res = await client.users.lookupByEmail({ email });
    const id = res.user?.id;

    if (res.user && id && res.user.name) {
      slackUserCache.set(id, { email, name: res.user.name });
    }

    if (id) return id;
    return null;
  });
  const settled = await Promise.allSettled(tasks);
  for (const r of settled) if (r.status === "fulfilled" && r.value) ids.push(r.value);
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
  const slackUserCache = new SlackUserCache(client);
  const { emails, channel, topic, timeRange, limit } = params;

  const parts: string[] = [];

  if (emails?.length) {
    const userIds = await lookupUserIdsByEmail(client, emails, slackUserCache);
    const { user_id: myUserId } = await client.auth.test();

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
  console.log("Matches are: ", matches);

  const hitsPromises = matches.slice(0, limit).map(async m => {
    const user = m.user ? await slackUserCache.get(m.user) : undefined;
    return {
      channelId: m.channel?.id || m.channel?.name || "",
      ts: m.ts,
      text: m.text,
      userEmail: user?.email ?? undefined,
      userName: user?.name ?? undefined,
    };
  });

  const hits = await Promise.all(hitsPromises);

  const tasks = hits.map(h =>
    limitHit(async () => {
      if (!h.ts) return null;

      try {
        const anchor = await fetchOneMessage(client, h.channelId, h.ts);
        const rootTs = anchor?.thread_ts || h.ts;

        if (anchor?.thread_ts) {
          // thread: fetch thread + permalink concurrently
          const [thread, permalink] = await Promise.all([
            fetchThread(client, h.channelId, rootTs),
            getPermalink(client, h.channelId, rootTs),
          ]);
          const contextPromises = thread
            .filter(t => t.ts)
            .map(async t => {
              const user = t.user ? await slackUserCache.get(t.user) : undefined;
              return {
                ts: t.ts!,
                text: t.text,
                userEmail: user?.email ?? undefined,
                userName: user?.name ?? undefined,
              };
            });

          const context = await Promise.all(contextPromises);

          const user = anchor.user ? await slackUserCache.get(anchor.user) : undefined;

          return {
            channelId: h.channelId,
            ts: rootTs,
            text: anchor.text ?? h.text,
            userEmail: user?.email ?? h.userEmail,
            userName: user?.name ?? h.userName,
            context,
            permalink,
          };
        } else {
          // not a thread: fetch context window + permalink concurrently
          const [ctx, permalink] = await Promise.all([
            fetchContextWindow(client, h.channelId, h.ts),
            getPermalink(client, h.channelId, h.ts),
          ]);
          const contextPromises = ctx
            .filter(t => t.ts)
            .map(async t => {
              const user = t.user ? await slackUserCache.get(t.user) : undefined;
              return {
                ts: t.ts!,
                text: t.text,
                userEmail: user?.email ?? undefined,
                userName: user?.name ?? undefined,
              };
            });
          const context = await Promise.all(contextPromises);

          const user = anchor?.user ? await slackUserCache.get(anchor.user) : undefined;

          return {
            channelId: h.channelId,
            ts: h.ts,
            text: anchor?.text ?? h.text,
            userEmail: user?.email ?? h.userEmail,
            userName: user?.name ?? h.userName,
            context,
            permalink,
          };
        }
      } catch {
        // fallback minimal object; still in parallel
        return {
          channelId: h.channelId,
          ts: h.ts,
          text: h.text,
          userEmail: h.userEmail,
          userName: h.userName,
          permalink: await getPermalink(client, h.channelId, h.ts),
        };
      }
    }),
  );

  const settled = await Promise.allSettled(tasks);

  const results: SlackSearchMessage[] = [];
  for (const r of settled) if (r.status === "fulfilled" && r.value) results.push(r.value);

  results.sort((a, b) => Number(b.ts) - Number(a.ts));
  return { query, results };
};

export default searchSlack;
