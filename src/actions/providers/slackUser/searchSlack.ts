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

const MENTION_USER_RE = /<@([UW][A-Z0-9]+)(?:\|[^>]+)?>/g;
const MENTION_CHANNEL_RE = /<#(C[A-Z0-9]+)(?:\|[^>]+)?>/g;
const SPECIAL_RE = /<!(channel|here|everyone)>/g;
const SUBTEAM_RE = /<!subteam\^([A-Z0-9]+)(?:\|[^>]+)?>/g; // user group

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
    case "today":
      return "on:today";
    case "yesterday":
      return "on:yesterday";
    case "last_7d":
      return `after:${fmtDaysAgo(7)}`;
    case "last_30d":
      return `after:${fmtDaysAgo(30)}`;
    default:
      return "";
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
  const { user_id: myUserId } = await client.auth.test();

  if (!myUserId) throw new Error("Failed to get my user ID.");

  const me = await slackUserCache.get(myUserId);
  const currentUser = {
    userId: myUserId,
    userName: me?.name,
    userEmail: me?.email,
  };

  if (emails?.length) {
    const userIds = await lookupUserIdsByEmail(client, emails, slackUserCache);

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

  const hitsPromises = matches.slice(0, limit).map(async m => {
    const user = m.user ? await slackUserCache.get(m.user) : undefined;

    const prettyText = m.text ? await expandSlackEntities(client, slackUserCache, m.text) : undefined;
    return {
      channelId: m.channel?.id || m.channel?.name || "",
      ts: m.ts,
      text: prettyText,
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
              const prettyText = t.text ? await expandSlackEntities(client, slackUserCache, t.text) : undefined;
              return {
                ts: t.ts!,
                text: prettyText,
                userEmail: user?.email ?? undefined,
                userName: user?.name ?? undefined,
              };
            });

          const context = await Promise.all(contextPromises);

          const user = anchor.user ? await slackUserCache.get(anchor.user) : undefined;
          const textResponse = anchor.text ?? h.text;
          const prettyText = textResponse ? await expandSlackEntities(client, slackUserCache, textResponse) : undefined;

          return {
            channelId: h.channelId,
            ts: rootTs,
            text: prettyText,
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
          text: h.text ? await expandSlackEntities(client, slackUserCache, h.text) : undefined,
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
  return {
    query,
    results: results.map(r => ({
      name: r.text || "Untitled",
      url: r.permalink || "",
      contents: r,
    })),
    currentUser,
  };
};

async function expandSlackEntities(
  client: WebClient,
  cache: SlackUserCache,
  raw: string,
  { includeEmail = false }: { includeEmail?: boolean } = {},
): Promise<string> {
  let text = raw;

  // 1) Users: <@U12345> -> @Name (or @Name <email>)
  const userIds = new Set<string>();
  for (const m of raw.matchAll(MENTION_USER_RE)) userIds.add(m[1]);

  const idToUser: Record<string, { name?: string; email?: string }> = {};
  await Promise.all(
    [...userIds].map(async id => {
      try {
        const u = await cache.get(id);
        idToUser[id] = { name: u?.name, email: u?.email };
      } catch {
        idToUser[id] = {};
      }
    }),
  );

  text = text.replace(MENTION_USER_RE, (_, id: string) => {
    const u = idToUser[id];
    if (u?.name) {
      return includeEmail && u.email ? `@${u.name} <${u.email}>` : `@${u.name}`;
    }
    // fallback: keep original token if we can't resolve
    return `@${id}`;
  });

  // 2) Channels: <#C12345|name> -> #name (fallback to #C12345)
  const channelIds = new Set<string>();
  for (const m of raw.matchAll(MENTION_CHANNEL_RE)) channelIds.add(m[1]);

  const idToChannel: Record<string, string | undefined> = {};
  await Promise.all(
    [...channelIds].map(async id => {
      try {
        const info = await client.conversations.info({ channel: id });
        idToChannel[id] = info.channel?.name ?? undefined;
      } catch {
        idToChannel[id] = undefined;
      }
    }),
  );

  text = text.replace(MENTION_CHANNEL_RE, (_, id: string) => `#${idToChannel[id] ?? id}`);

  // 3) Special mentions: <!here>, <!channel>, <!everyone>
  text = text.replace(SPECIAL_RE, (_, kind: string) => `@${kind}`);

  // 4) User groups: <!subteam^S123|@group> -> @group (fallback to @S123)
  text = text.replace(SUBTEAM_RE, (_m, sid: string) => `@${sid}`);

  // 5) Slack links: <https://x|label> -> label (or the URL)
  text = text.replace(/<([^>|]+)\|([^>]+)>/g, (_m, _url: string, label: string) => label); // keep label
  text = text.replace(/<([^>|]+)>/g, (_m, url: string) => url); // bare <https://…>

  return text;
}

export default searchSlack;
