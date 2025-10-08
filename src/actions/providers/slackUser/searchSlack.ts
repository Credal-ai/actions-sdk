import { WebClient } from "@slack/web-api";
import {
  type slackUserSearchSlackFunction,
  type slackUserSearchSlackOutputType,
  type slackUserSearchSlackParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import pLimit from "p-limit";
import type { Match } from "@slack/web-api/dist/types/response/SearchMessagesResponse.js";

/* ===================== Constants ===================== */

const HIT_ENRICH_POOL = 2; // keep concurrency conservative to avoid 429s
const limitHit = pLimit(HIT_ENRICH_POOL);

const MENTION_USER_RE = /<@([UW][A-Z0-9]+)(?:\|[^>]+)?>/g;
const MENTION_CHANNEL_RE = /<#(C[A-Z0-9]+)(?:\|[^>]+)?>/g;
const SPECIAL_RE = /<!(channel|here|everyone)>/g;
const SUBTEAM_RE = /<!subteam\^([A-Z0-9]+)(?:\|[^>]+)?>/g;

/* ===================== Types ===================== */

export type TimeRange = "latest" | "today" | "yesterday" | "last_7d" | "last_30d" | "all";

export interface SlackSearchMessage {
  channelId: string;
  ts: string;
  text?: string;
  userEmail?: string;
  userName?: string;
  permalink?: string;
  context?: Array<{ ts: string; text?: string; userEmail?: string; userName?: string }>;
  members?: Array<{ userId: string; userEmail?: string; userName?: string }>;
}

interface SlackMessage {
  ts?: string;
  text?: string;
  user?: string;
  username?: string;
  thread_ts?: string;
}

/* ===================== Cache ===================== */

class SlackUserCache {
  private cache = new Map<string, { email?: string; name?: string }>();
  private pending = new Map<string, Promise<{ email?: string; name?: string } | undefined>>();

  constructor(private client: WebClient) {}

  getSync(id: string) {
    return this.cache.get(id);
  }

  async get(id: string): Promise<{ email?: string; name?: string } | undefined> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const pending = this.pending.get(id);
    if (pending) return pending;

    // fallback to users.info only if we have to
    const promise = (async () => {
      try {
        const res = await this.client.users.info({ user: id });
        if (res.user?.id) {
          const u = {
            name: res.user.profile?.display_name ?? res.user.real_name ?? res.user.name,
            email: res.user.profile?.email,
          };
          this.cache.set(id, u);
          return u;
        }
        return undefined;
      } finally {
        this.pending.delete(id);
      }
    })();

    this.pending.set(id, promise);
    return promise;
  }

  set(id: string, { email, name }: { email?: string; name?: string }) {
    this.cache.set(id, { email, name });
  }
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
  return d.toISOString().slice(0, 10);
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

async function lookupUserIdsByEmail(client: WebClient, emails: string[], cache: SlackUserCache): Promise<string[]> {
  const ids: string[] = [];
  const settled = await Promise.allSettled(
    emails.map(async raw => {
      const email = raw.trim();
      if (!email) return null;
      const res = await client.users.lookupByEmail({ email });
      const id = res.user?.id;
      if (id && res.user) {
        cache.set(id, {
          name: res.user.profile?.display_name ?? res.user.real_name ?? res.user.name,
          email: res.user.profile?.email,
        });
      }
      return id ?? null;
    }),
  );
  for (const r of settled) if (r.status === "fulfilled" && r.value) ids.push(r.value);
  return ids;
}

async function tryGetMPIMName(client: WebClient, userIds: string[]): Promise<string | null> {
  try {
    const res = await client.conversations.open({ users: userIds.join(",") });
    const id = res.channel?.id;
    if (!id) return null;
    const info = await client.conversations.info({ channel: id });
    return info.channel?.name ?? null;
  } catch {
    return null;
  }
}

async function getPermalink(client: WebClient, channel: string, ts: string) {
  try {
    const res = await client.chat.getPermalink({ channel, message_ts: ts });
    return res.permalink;
  } catch {
    return undefined;
  }
}

async function fetchOneMessage(client: WebClient, channel: string, ts: string): Promise<SlackMessage | undefined> {
  const r = await client.conversations.history({ channel, latest: ts, inclusive: true, limit: 1 });
  return r.messages?.[0];
}
async function fetchThread(client: WebClient, channel: string, threadTs: string) {
  const r = await client.conversations.replies({ channel, ts: threadTs, limit: 20 });
  return r.messages ?? [];
}
async function fetchContextWindow(client: WebClient, channel: string, ts: string) {
  const out: SlackMessage[] = [];
  const anchor = await fetchOneMessage(client, channel, ts);
  if (!anchor) return out;
  const before = await client.conversations.history({ channel, latest: ts, inclusive: false, limit: 3 });
  out.push(...(before.messages ?? []).reverse());
  out.push(anchor);
  const after = await client.conversations.history({ channel, oldest: ts, inclusive: false, limit: 3 });
  out.push(...(after.messages ?? []));
  return out;
}

function hasOverlap(messages: SlackMessage[], ids: string[], minOverlap: number): boolean {
  const participants = new Set(messages.map(m => m.user).filter(Boolean));
  const overlap = ids.filter(id => participants.has(id)).length;
  return overlap >= minOverlap;
}

async function expandSlackEntities(cache: SlackUserCache, raw: string): Promise<string> {
  let text = raw;

  const userIds = [...raw.matchAll(MENTION_USER_RE)].map(m => m[1]);

  // resolve all in parallel: prefer cache, else users.info
  const idToName: Record<string, string> = {};
  await Promise.all(
    userIds.map(async id => {
      const u = await cache.get(id); // get() will call users.info if missing
      if (u?.name) idToName[id] = u.name;
    })
  );
   text = text.replace(MENTION_USER_RE, (_, id) => `@${idToName[id] ?? id}`);
  text = text.replace(MENTION_CHANNEL_RE, (_, id) => `#${id}`);
  text = text.replace(SPECIAL_RE, (_, kind) => `@${kind}`);
  text = text.replace(SUBTEAM_RE, (_m, sid) => `@${sid}`);
  text = text.replace(/<([^>|]+)\|([^>]+)>/g, (_m, _url, label) => label);
  text = text.replace(/<([^>|]+)>/g, (_m, url) => url);
  return text;
}

async function searchScoped(input: {
  client: WebClient;
  scope: string;
  topic?: string;
  timeRange: TimeRange;
  limit: number;
}) {
  const { client, scope, topic, timeRange, limit } = input;
  const parts = [`in:${scope}`];
  if (topic?.trim()) parts.push(topic.trim());
  const tf = timeFilter(timeRange);
  if (tf) parts.push(tf);

  const query = parts.join(" ");
  const searchRes = await client.search.messages({ query, count: limit, highlight: true });
  return searchRes.messages?.matches ?? [];
}

async function searchByTopic(input: { client: WebClient; topic?: string; timeRange: TimeRange; limit: number }) {
  const { client, topic, timeRange, limit } = input;
  const parts: string[] = [];
  if (topic?.trim()) parts.push(topic.trim());
  const tf = timeFilter(timeRange);
  if (tf) parts.push(tf);
  const query = parts.join(" ");
  const searchRes = await client.search.messages({ query, count: limit, highlight: true });
  return searchRes.messages?.matches ?? [];
}

function dedupeAndSort(results: SlackSearchMessage[]): SlackSearchMessage[] {
  const seen = new Set<string>();
  const out: SlackSearchMessage[] = [];
  for (const r of results) {
    const key = `${r.channelId}-${r.ts}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out.sort((a, b) => Number(b.ts) - Number(a.ts));
}

/* ===================== MAIN EXPORT ===================== */

const searchSlack: slackUserSearchSlackFunction = async ({
  params,
  authParams,
}: {
  params: slackUserSearchSlackParamsType;
  authParams: AuthParamsType;
}): Promise<slackUserSearchSlackOutputType> => {
  if (!authParams.authToken) throw new Error(MISSING_AUTH_TOKEN);
  const client = new WebClient(authParams.authToken);
  const cache = new SlackUserCache(client);

  const { emails, topic, timeRange, limit = 20, channel } = params;

  const { user_id: myUserId } = await client.auth.test();
  if (!myUserId) throw new Error("Failed to get my user ID.");

  // preload myself
  const meInfo = await cache.get(myUserId);

  // resolve targets by email
  const targetIds = emails?.length ? await lookupUserIdsByEmail(client, emails, cache) : [];
  const filteredTargetIds = targetIds.filter(id => id !== myUserId);

  const allMatches: Match[] = [];
  const searchPromises: Promise<Match[]>[] = [];

  if (filteredTargetIds.length === 1) {
    searchPromises.push(searchScoped({ client, scope: `<@${filteredTargetIds[0]}>`, topic, timeRange, limit }));
  } else if (filteredTargetIds.length >= 2) {
    const searchMPIM = async () => {
      const mpimName = await tryGetMPIMName(client, filteredTargetIds);
      return mpimName ? searchScoped({ client, scope: mpimName, topic, timeRange, limit }) : [];
    };
    searchPromises.push(searchMPIM());
    searchPromises.push(
      ...filteredTargetIds.map(id => searchScoped({ client, scope: `<@${id}>`, topic, timeRange, limit })),
    );
  } else if (channel) {
    searchPromises.push(searchScoped({ client, scope: normalizeChannelOperand(channel), topic, timeRange, limit }));
  }
  if (topic) {
    searchPromises.push(searchByTopic({ client, topic, timeRange, limit }));
  }

  const searchResults = await Promise.all(searchPromises);
  searchResults.forEach(matches => allMatches.push(...matches));

  const channelInfoCache = new Map<string, { isIm: boolean; isMpim: boolean; members: string[] }>();

  const expanded = await Promise.all(
    allMatches.map(m =>
      limitHit(async () => {
        if (!m.ts || !m.channel?.id) return null;
        const anchor = await fetchOneMessage(client, m.channel.id, m.ts);
        const rootTs = anchor?.thread_ts || m.ts;

        // channel info
        let channelInfo = channelInfoCache.get(m.channel.id);
        if (!channelInfo) {
          const convoInfo = await client.conversations.info({ channel: m.channel.id });
          const isIm = convoInfo.channel?.is_im ?? false;
          const isMpim = convoInfo.channel?.is_mpim ?? false;
          let members: string[] = [];
          if (isIm || isMpim) {
            const res = await client.conversations.members({ channel: m.channel.id });
            members = res.members ?? [];
          }
          channelInfo = { isIm, isMpim, members };
          channelInfoCache.set(m.channel.id, channelInfo);
        }

        // context + permalink
        const [contextMsgs, permalink] = anchor?.thread_ts
          ? [
              await fetchThread(client, m.channel.id, rootTs),
              m.permalink ?? (await getPermalink(client, m.channel.id, rootTs)),
            ]
          : [
              await fetchContextWindow(client, m.channel.id, m.ts),
              m.permalink ?? (await getPermalink(client, m.channel.id, m.ts)),
            ];

        // filter logic
        let passesFilter = false;
        if (channelInfo.isIm || channelInfo.isMpim) {
          const overlap = filteredTargetIds.filter(id => channelInfo!.members.includes(id)).length;
          passesFilter = overlap >= 1;
        } else {
          passesFilter = hasOverlap(contextMsgs, filteredTargetIds, 1);
        }
        if (filteredTargetIds.length && !passesFilter) return null;

        const context = await Promise.all(
          contextMsgs.map(async t => {
            const u = t.user ? await cache.get(t.user) : undefined;
            return {
              ts: t.ts!,
              text: t.text ? await expandSlackEntities(cache, t.text) : undefined,
              userEmail: u?.email,
              userName: u?.name ?? (t as SlackMessage).username,
            };
          }),
        );

        const anchorUser = anchor?.user ? await cache.get(anchor.user) : undefined;

        return {
          channelId: m.channel.id,
          ts: rootTs,
          text: anchor?.text ? await expandSlackEntities(cache, anchor.text) : undefined,
          userEmail: anchorUser?.email,
          userName: anchorUser?.name ?? anchor?.username,
          context,
          permalink: m.permalink ?? permalink,
          members: (channelInfo.members ?? []).map(uid => {
            const u = cache.getSync(uid);
            return { userId: uid, userEmail: u?.email, userName: u?.name };
          }),
        } satisfies SlackSearchMessage;
      }),
    ),
  );

  const results = dedupeAndSort(expanded.filter(Boolean) as SlackSearchMessage[]);

  return {
    query: topic ?? "",
    results: results.map(r => ({
      name: r.text || "Untitled",
      url: r.permalink || "",
      contents: r,
    })),
    currentUser: { userId: myUserId, userName: meInfo?.name, userEmail: meInfo?.email },
  };
};

export default searchSlack;
