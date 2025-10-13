import { type KnownBlock, WebClient, LogLevel } from "@slack/web-api";
import type { RichTextBlockElement, RichTextElement } from "@slack/types";
import type { Attachment } from "@slack/web-api/dist/types/response/ChannelsHistoryResponse.js";
import type { Match } from "@slack/web-api/dist/types/response/SearchMessagesResponse.js";
import type { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse.js";
import PQueue from "p-queue";

import {
  type slackUserSearchSlackFunction,
  type slackUserSearchSlackOutputType,
  type slackUserSearchSlackParamsType,
  type AuthParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/* ===================== PER-FAMILY QUEUES ===================== */

// Slack applies rate limits per endpoint family, not globally.
// These values reflect realistic steady-state limits.
const queues = {
  conversations: new PQueue({ interval: 1000, intervalCap: 3 }), // 1 req/sec
  users: new PQueue({ interval: 60000, intervalCap: 20 }), // 20 req/min
  chat: new PQueue({ interval: 10000, intervalCap: 5 }), // 5 req/10s
  search: new PQueue({ interval: 60000, intervalCap: 20 }), // 20 req/min
  other: new PQueue({ interval: 1000, intervalCap: 2 }), // fallback
};

/**
 * Auto-routes each Slack API call to the correct rate-limit bucket.
 */
async function queuedSlack<T>(methodName: string, fn: () => Promise<T>): Promise<T> {
  const lower = methodName.toLowerCase();
  let bucket: keyof typeof queues = "other";

  if (lower.startsWith("conversations.")) bucket = "conversations";
  else if (lower.startsWith("users.")) bucket = "users";
  else if (lower.startsWith("chat.")) bucket = "chat";
  else if (lower.startsWith("search.")) bucket = "search";

  return queues[bucket].add(async () => {
    return await fn();
  });
}

/* ===================== CONSTANTS ===================== */

const MENTION_USER_RE = /<@([UW][A-Z0-9]+)(?:\|[^>]+)?>/g;
const MENTION_CHANNEL_RE = /<#(C[A-Z0-9]+)(?:\|[^>]+)?>/g;
const SPECIAL_RE = /<!(channel|here|everyone)>/g;
const SUBTEAM_RE = /<!subteam\^([A-Z0-9]+)(?:\|[^>]+)?>/g;

/* ===================== TYPES ===================== */

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
  blocks?: KnownBlock[];
  attachments?: Attachment[];
}

/* ===================== USER CACHE ===================== */

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

    const promise = (async () => {
      try {
        const res = await queuedSlack("users.info", () => this.client.users.info({ user: id }));
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

/* ===================== TEXT EXTRACTION ===================== */

export function extractMessageText(m: SlackMessage | undefined): string | undefined {
  if (!m) return undefined;
  const pieces: string[] = [];

  const walkRichTextInline = (el: RichTextElement): string[] => {
    switch (el.type) {
      case "text":
        return [el.text];
      case "link":
        return [el.text || el.url];
      case "user":
        return [`<@${el.user_id}>`];
      case "channel":
        return [`<#${el.channel_id}>`];
      case "emoji":
        return [`:${el.name}:`];
      case "broadcast":
        return [`@${el.range}`];
      case "date":
        return [el.fallback ?? `<date:${el.timestamp}>`];
      case "team":
        return [`<team:${el.team_id}>`];
      case "usergroup":
        return [`<usergroup:${el.usergroup_id}>`];
      default:
        return [];
    }
  };

  const walkRichTextElement = (el: RichTextBlockElement): string[] => {
    switch (el.type) {
      case "rich_text_section":
      case "rich_text_quote":
        return el.elements.flatMap(walkRichTextInline);
      case "rich_text_list":
        return el.elements.flatMap(section => section.elements.flatMap(walkRichTextInline));
      case "rich_text_preformatted":
        return el.elements.flatMap(walkRichTextInline);
      default:
        return [];
    }
  };

  const walkBlock = (block: KnownBlock): string[] => {
    switch (block.type) {
      case "section":
        return [
          block.text?.text ?? "",
          ...(block.fields?.map(f => f.text || "") ?? []),
          "accessory" in block && block.accessory && "text" in block.accessory
            ? (block.accessory.text?.text ?? "")
            : "",
        ].filter(Boolean);
      case "context":
        return (block.elements ?? []).map(el => ("text" in el && el.text) || "").filter(Boolean);
      case "header":
        return block.text?.text ? [block.text.text] : [];
      case "rich_text":
        return block.elements.flatMap(walkRichTextElement);
      case "markdown":
        return block.text ? [block.text] : [];
      case "video":
        return [block.title?.text, block.description?.text].filter(Boolean) as string[];
      case "image":
        return block.title?.text ? [block.title.text] : [];
      case "input":
        return [block.label?.text, block.hint?.text].filter(Boolean) as string[];
      default:
        return [];
    }
  };

  if (Array.isArray(m.blocks)) pieces.push(...m.blocks.flatMap(walkBlock));
  if (m.text) pieces.push(m.text);
  if (m.attachments) {
    for (const att of m.attachments) {
      if (att.pretext) pieces.push(att.pretext);
      if (att.title) pieces.push(att.title);
      if (att.text) pieces.push(att.text);
      if (att.fields) for (const f of att.fields) pieces.push([f.title, f.value].filter(Boolean).join(": "));
    }
  }

  const out = Array.from(new Set(pieces.map(s => s.trim()).filter(Boolean))).join("\n");
  return out || undefined;
}

/* ===================== HELPERS ===================== */

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

function hasOverlap(messages: SlackMessage[], ids: string[], minOverlap: number): boolean {
  const participants = new Set(messages.map(m => m.user).filter(Boolean));
  const overlap = ids.filter(id => participants.has(id)).length;
  return overlap >= minOverlap;
}

/* ===================== SLACK API HELPERS ===================== */

async function lookupUserIdsByEmail(client: WebClient, emails: string[], cache: SlackUserCache): Promise<string[]> {
  const ids: string[] = [];
  const settled = await Promise.allSettled(
    emails.map(async raw => {
      const email = raw.trim();
      if (!email) return null;
      const res = await queuedSlack("users.lookupByEmail", () => client.users.lookupByEmail({ email }));
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
    const res = await queuedSlack("conversations.open", () => client.conversations.open({ users: userIds.join(",") }));
    const id = res.channel?.id;
    if (!id) return null;
    const info = await queuedSlack("conversations.info", () => client.conversations.info({ channel: id }));
    return info.channel?.name ?? null;
  } catch {
    return null;
  }
}

async function getPermalink(client: WebClient, channel: string, ts: string) {
  try {
    const res = await queuedSlack("chat.getPermalink", () => client.chat.getPermalink({ channel, message_ts: ts }));
    return res.permalink;
  } catch {
    return undefined;
  }
}

async function fetchOneMessage(client: WebClient, channel: string, ts: string): Promise<SlackMessage | undefined> {
  const r = await queuedSlack("conversations.history", () =>
    client.conversations.history({ channel, latest: ts, inclusive: true, limit: 1 }),
  );
  const message = r.messages?.[0];
  if (!message) return undefined;
  return {
    ts: message.ts,
    text: message.text,
    user: message.user,
    username: message.username,
    thread_ts: message.thread_ts,
    blocks: message.blocks as unknown as KnownBlock[],
    attachments: message.attachments,
  };
}

async function fetchThread(client: WebClient, channel: string, threadTs: string) {
  const r = await queuedSlack("conversations.replies", () =>
    client.conversations.replies({ channel, ts: threadTs, limit: 20 }),
  );
  return r.messages?.map(transformToSlackMessage) ?? [];
}

function transformToSlackMessage(message: MessageElement): SlackMessage {
  return {
    ts: message.ts,
    text: message.text,
    user: message.user,
    username: message.username,
    thread_ts: message.thread_ts,
    blocks: message.blocks as unknown as KnownBlock[],
    attachments: message.attachments,
  };
}

async function fetchContextWindow(client: WebClient, channel: string, ts: string) {
  const out: SlackMessage[] = [];
  const anchor = await fetchOneMessage(client, channel, ts);
  if (!anchor) return out;
  const before = await queuedSlack("conversations.history", () =>
    client.conversations.history({ channel, latest: ts, inclusive: false, limit: 3 }),
  );
  const after = await queuedSlack("conversations.history", () =>
    client.conversations.history({ channel, oldest: ts, inclusive: false, limit: 3 }),
  );
  const beforeMsgs = before.messages?.map(transformToSlackMessage) ?? [];
  const afterMsgs = after.messages?.map(transformToSlackMessage) ?? [];
  out.push(...beforeMsgs.reverse(), anchor, ...afterMsgs);
  return out;
}

/* ===================== ENTITY EXPANSION ===================== */

async function expandSlackEntities(cache: SlackUserCache, raw: string): Promise<string> {
  let text = raw;
  const userIds = [...raw.matchAll(MENTION_USER_RE)].map(m => m[1]);
  const idToName: Record<string, string> = {};
  await Promise.all(
    userIds.map(async id => {
      const u = await cache.get(id);
      if (u?.name) idToName[id] = u.name;
    }),
  );
  text = text
    .replace(MENTION_USER_RE, (_, id) => `@${idToName[id] ?? id}`)
    .replace(MENTION_CHANNEL_RE, (_, id) => `#${id}`)
    .replace(SPECIAL_RE, (_, kind) => `@${kind}`)
    .replace(SUBTEAM_RE, (_, sid) => `@${sid}`)
    .replace(/<([^>|]+)\|([^>]+)>/g, (_m, _url, label) => label)
    .replace(/<([^>|]+)>/g, (_m, url) => url);
  return text;
}

/* ===================== SEARCH HELPERS ===================== */

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
  const searchRes = await queuedSlack("search.messages", () =>
    client.search.messages({ query, count: limit, highlight: true }),
  );
  return searchRes.messages?.matches ?? [];
}

/* ===================== MAIN FUNCTION ===================== */

const searchSlack: slackUserSearchSlackFunction = async ({
  params,
  authParams,
}: {
  params: slackUserSearchSlackParamsType;
  authParams: AuthParamsType;
}): Promise<slackUserSearchSlackOutputType> => {
  console.log("searchSlack");
  if (!authParams.authToken) throw new Error(MISSING_AUTH_TOKEN);

  const client = new WebClient(authParams.authToken, { logLevel: LogLevel.WARN });
  const cache = new SlackUserCache(client);

  const { emails, topic, timeRange, limit = 20, channel } = params;

  const myUser = await queuedSlack("auth.test", () => client.auth.test());
  const myUserId = myUser.user_id!;
  await cache.get(myUserId);

  const targetIds = emails?.length ? await lookupUserIdsByEmail(client, emails, cache) : [];
  const filteredTargetIds = targetIds.filter(id => id !== myUserId);

  const allMatches: Match[] = [];
  const searchPromises: Promise<Match[]>[] = [];

  if (filteredTargetIds.length === 1) {
    searchPromises.push(searchScoped({ client, scope: `<@${filteredTargetIds[0]}>`, topic, timeRange, limit }));
  } else if (filteredTargetIds.length >= 2) {
    const mpimName = await tryGetMPIMName(client, filteredTargetIds);
    if (mpimName) searchPromises.push(searchScoped({ client, scope: mpimName, topic, timeRange, limit }));
    searchPromises.push(
      ...filteredTargetIds.map(id => searchScoped({ client, scope: `<@${id}>`, topic, timeRange, limit })),
    );
  } else if (channel) {
    searchPromises.push(searchScoped({ client, scope: channel, topic, timeRange, limit }));
  }
  if (topic) {
    searchPromises.push(searchScoped({ client, scope: "", topic, timeRange, limit }));
  }

  const searchResults = await Promise.all(searchPromises);
  searchResults.forEach(matches => allMatches.push(...matches));
  console.log("searchResults length", allMatches.length);

  const expanded: SlackSearchMessage[] = [];
  const channelInfoCache = new Map<string, { isIm: boolean; isMpim: boolean; members: string[] }>();

  for await (const m of allMatches) {
    if (!m.ts || !m.channel?.id) continue;
    const anchor = await fetchOneMessage(client, m.channel.id, m.ts);
    if (!anchor) continue;

    const rootTs = anchor.thread_ts || m.ts;
    let channelInfo = channelInfoCache.get(m.channel.id);

    if (!m.channel?.id) continue;
    if (!channelInfo) {
      // @ts-expect-error asffasasf
      const info = await queuedSlack("conversations.info", () => client.conversations.info({ channel: m.channel.id }));
      const isIm = info.channel?.is_im ?? false;
      const isMpim = info.channel?.is_mpim ?? false;
      let members: string[] = [];
      if (isIm || isMpim) {
        const res = await queuedSlack("conversations.members", () =>
          // @ts-expect-error asffasasf
          client.conversations.members({ channel: m.channel.id }),
        );
        members = res.members ?? [];
      }
      channelInfo = { isIm, isMpim, members };
      channelInfoCache.set(m.channel.id, channelInfo);
    }

    const [contextMsgs, permalink] = anchor.thread_ts
      ? [
          await fetchThread(client, m.channel.id, rootTs),
          m.permalink ?? (await getPermalink(client, m.channel.id, rootTs)),
        ]
      : [
          await fetchContextWindow(client, m.channel.id, m.ts),
          m.permalink ?? (await getPermalink(client, m.channel.id, m.ts)),
        ];

    const passesFilter =
      filteredTargetIds.length === 0 ||
      (channelInfo.isIm || channelInfo.isMpim
        ? filteredTargetIds.some(id => channelInfo!.members.includes(id))
        : hasOverlap(contextMsgs, filteredTargetIds, 1));

    if (!passesFilter) continue;

    const context = await Promise.all(
      contextMsgs.map(async t => {
        const u = t.user ? await cache.get(t.user) : undefined;
        const rawText = extractMessageText(t);
        return {
          ts: t.ts!,
          text: rawText ? await expandSlackEntities(cache, rawText) : undefined,
          userEmail: u?.email,
          userName: u?.name ?? t.username,
        };
      }),
    );

    const anchorUser = anchor.user ? await cache.get(anchor.user) : undefined;
    const anchorText = extractMessageText(anchor);

    expanded.push({
      channelId: m.channel.id,
      ts: rootTs,
      text: anchorText ? await expandSlackEntities(cache, anchorText) : undefined,
      userEmail: anchorUser?.email,
      userName: anchorUser?.name ?? anchor?.username,
      context,
      permalink: m.permalink ?? permalink,
      members: (channelInfo.members ?? []).map(uid => {
        const u = cache.getSync(uid);
        return { userId: uid, userEmail: u?.email, userName: u?.name };
      }),
    });
  }

  return {
    query: topic ?? "",
    results: expanded.map(r => ({
      name: r.text || "Untitled",
      url: r.permalink || "",
      contents: r,
    })),
    currentUser: { userId: myUserId },
  };
};

export default searchSlack;
