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

const HIT_ENRICH_POOL = 5;
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
  members?: Array<{ userId: string | undefined; userEmail: string | undefined; userName: string | undefined }>;
}

interface SlackMessage {
  ts?: string;
  text?: string;
  user?: string;
  thread_ts?: string;
}

/* ===================== Cache ===================== */

class SlackUserCache {
  private cache: Map<string, { email: string; name: string }>;
  private pendingRequests: Map<string, Promise<{ email: string; name: string } | undefined>>;

  constructor(private client: WebClient) {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.client = client;
  }

  async get(id: string): Promise<{ email: string; name: string } | undefined> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const pending = this.pendingRequests.get(id);
    if (pending) return pending;

    const promise = (async () => {
      try {
        const res = await this.client.users.info({ user: id });
        const u = {
          name: res.user?.profile?.display_name ?? res.user?.real_name ?? res.user?.name ?? "",
          email: res.user?.profile?.email ?? "",
        };
        if (res.user && id) {
          this.cache.set(id, u);
          return u;
        }
        return undefined;
      } finally {
        this.pendingRequests.delete(id);
      }
    })();

    this.pendingRequests.set(id, promise);
    return promise;
  }

  set(id: string, { email, name }: { email: string; name: string }) {
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
          name: res.user.profile?.display_name ?? res.user.real_name ?? res.user.name ?? "",
          email: res.user.profile?.email ?? "",
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
  const r = await client.conversations.replies({ channel, ts: threadTs, limit: 50 });
  return r.messages ?? [];
}
async function fetchContextWindow(client: WebClient, channel: string, ts: string) {
  const out: SlackMessage[] = [];
  const anchor = await fetchOneMessage(client, channel, ts);
  if (!anchor) return out;
  const before = await client.conversations.history({ channel, latest: ts, inclusive: false, limit: 4 });
  out.push(...(before.messages ?? []).reverse());
  out.push(anchor);
  const after = await client.conversations.history({ channel, oldest: ts, inclusive: false, limit: 5 });
  out.push(...(after.messages ?? []));
  return out;
}

function hasOverlap(messages: SlackMessage[], ids: string[], minOverlap: number): boolean {
  const participants = new Set(messages.map(m => m.user).filter(Boolean));
  const overlap = ids.filter(id => participants.has(id)).length;
  return overlap >= minOverlap;
}

async function expandSlackEntities(client: WebClient, cache: SlackUserCache, raw: string): Promise<string> {
  let text = raw;

  // resolve users
  const userIds = new Set<string>();
  for (const m of raw.matchAll(MENTION_USER_RE)) userIds.add(m[1]);
  const idToUser: Record<string, { name?: string }> = {};
  await Promise.all(
    [...userIds].map(async id => {
      const u = await cache.get(id);
      idToUser[id] = { name: u?.name };
    }),
  );
  text = text.replace(MENTION_USER_RE, (_, id) => `@${idToUser[id]?.name ?? id}`);

  // channels
  text = text.replace(MENTION_CHANNEL_RE, (_, id) => `#${id}`);
  // special mentions
  text = text.replace(SPECIAL_RE, (_, kind) => `@${kind}`);
  // subteams
  text = text.replace(SUBTEAM_RE, (_m, sid) => `@${sid}`);
  // links
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

  const me = myUserId ? await cache.get(myUserId) : undefined;

  const targetIds = emails?.length ? await lookupUserIdsByEmail(client, emails, cache) : [];
  const filteredTargetIds = targetIds.filter(id => id !== myUserId);

  const allMatches: Match[] = [];

  // --- Parallel search execution for better performance ---
  const searchPromises: Promise<Match[]>[] = [];

  // Scoped DM/MPIM searches
  if (filteredTargetIds.length === 1) {
    searchPromises.push(searchScoped({ client, scope: `<@${filteredTargetIds[0]}>`, topic, timeRange, limit }));
  } else if (filteredTargetIds.length >= 2) {
    // Run MPIM lookup and individual DM searches in parallel
    const searchMPIM = async () => {
      const mpimName = await tryGetMPIMName(client, filteredTargetIds);
      return mpimName ? searchScoped({ client, scope: mpimName, topic, timeRange, limit }) : [];
    };
    
    searchPromises.push(searchMPIM());

    // Add individual DM searches
    searchPromises.push(
      ...filteredTargetIds.map(id => searchScoped({ client, scope: `<@${id}>`, topic, timeRange, limit })),
    );
  } else if (channel) {
    searchPromises.push(searchScoped({ client, scope: normalizeChannelOperand(channel), topic, timeRange, limit }));
  }

  // Topic-wide search in parallel
  searchPromises.push(...(topic ? [searchByTopic({ client, topic, timeRange, limit })] : []));

  // Execute all searches in parallel
  const searchResults = await Promise.all(searchPromises);
  searchResults.forEach(matches => allMatches.push(...matches));

  // --- Expand hits with context + filter overlap ---
  // Create a channel info cache to avoid redundant API calls
  const channelInfoCache = new Map<string, { isIm: boolean; isMpim: boolean; members?: string[] }>();

  const expanded = await Promise.all(
    allMatches.map(m =>
      limitHit(async () => {
        if (!m.ts || !m.channel?.id) return null;
        const anchor = await fetchOneMessage(client, m.channel.id, m.ts);
        const rootTs = anchor?.thread_ts || m.ts;

        let members: { userId: string | undefined; userEmail: string | undefined; userName: string | undefined }[] = [];

        // Check convo type (DM, MPIM, channel) with caching
        let channelInfo = channelInfoCache.get(m.channel.id);
        if (!channelInfo) {
          const convoInfo = await client.conversations.info({ channel: m.channel.id });
          channelInfo = {
            isIm: convoInfo.channel?.is_im ?? false,
            isMpim: convoInfo.channel?.is_mpim ?? false,
          };
          channelInfoCache.set(m.channel.id, channelInfo);
        }
        const { isIm, isMpim } = channelInfo;

        const [contextMsgs, permalink] = anchor?.thread_ts
          ? [await fetchThread(client, m.channel.id, rootTs), await getPermalink(client, m.channel.id, rootTs)]
          : [await fetchContextWindow(client, m.channel.id, m.ts), await getPermalink(client, m.channel.id, m.ts)];

        let passesFilter = false;
        if (isIm || isMpim) {
          // DM/MPIM: use members, not authorship
          const membersRes = (await client.conversations.members({ channel: m.channel.id })).members ?? [];
          members = await Promise.all(
            membersRes.map(async uid => {
              const u = await cache.get(uid);
              return { userId: uid, userEmail: u?.email, userName: u?.name };
            }),
          );
          const overlap = filteredTargetIds.filter(id => membersRes.includes(id)).length;
          passesFilter = overlap >= 1;
        } else {
          // Channel: use authorship
          passesFilter = hasOverlap(contextMsgs, filteredTargetIds, 1);
        }

        if (filteredTargetIds.length && !passesFilter) return null;

        const context = await Promise.all(
          contextMsgs.map(async t => ({
            ts: t.ts!,
            text: t.text ? await expandSlackEntities(client, cache, t.text) : undefined,
            userEmail: t.user ? (await cache.get(t.user))?.email : undefined,
            userName: t.user ? (await cache.get(t.user))?.name : undefined,
          })),
        );

        return {
          channelId: m.channel.id,
          ts: rootTs,
          text: anchor?.text ? await expandSlackEntities(client, cache, anchor.text) : undefined,
          userEmail: anchor?.user ? (await cache.get(anchor.user))?.email : undefined,
          userName: anchor?.user ? (await cache.get(anchor.user))?.name : undefined,
          context,
          permalink,
          members,
        } satisfies SlackSearchMessage;
      }),
    ),
  );

  const results = dedupeAndSort(expanded.filter(h => h !== null) as SlackSearchMessage[]);

  return {
    query: topic ?? "",
    results: results.map(r => ({
      name: r.text || "Untitled",
      url: r.permalink || "",
      contents: r,
    })),
    currentUser: { userId: myUserId, userName: me?.name, userEmail: me?.email },
  };
};

export default searchSlack;
