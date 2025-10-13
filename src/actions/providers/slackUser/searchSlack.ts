import { type KnownBlock, WebClient } from "@slack/web-api";
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

const queues = {
  conversations: new PQueue({ interval: 1000, intervalCap: 3 }),
  users: new PQueue({ interval: 60000, intervalCap: 20 }),
  chat: new PQueue({ interval: 10000, intervalCap: 5 }),
  search: new PQueue({ interval: 60000, intervalCap: 20 }),
  other: new PQueue({ interval: 1000, intervalCap: 2 }),
};

async function queuedSlack<T>(methodName: string, fn: () => Promise<T>): Promise<T> {
  const lower = methodName.toLowerCase();
  let bucket: keyof typeof queues = "other";
  if (lower.startsWith("conversations.")) bucket = "conversations";
  else if (lower.startsWith("users.")) bucket = "users";
  else if (lower.startsWith("chat.")) bucket = "chat";
  else if (lower.startsWith("search.")) bucket = "search";
  return queues[bucket].add(fn);
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

/* ===================== HELPERS ===================== */

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

function hasOverlap(messages: SlackMessage[], ids: string[], minOverlap: number): boolean {
  const participants = new Set(messages.map(m => m.user).filter(Boolean));
  const overlap = ids.filter(id => participants.has(id)).length;
  return overlap >= minOverlap;
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

  const walkRichTextInline = (el: RichTextElement) => {
    const blockPieces: string[] = [];
    switch (el.type) {
      case "text":
        blockPieces.push(el.text);
        break;
      case "link":
        blockPieces.push(el.text || el.url);
        break;
      case "user":
        blockPieces.push(`<@${el.user_id}>`);
        break;
      case "channel":
        blockPieces.push(`<#${el.channel_id}>`);
        break;
      case "emoji":
        blockPieces.push(`:${el.name}:`);
        break;
      case "broadcast":
        blockPieces.push(`@${el.range}`);
        break;
      case "date":
        blockPieces.push(el.fallback ?? `<date:${el.timestamp}>`);
        break;
      case "team":
        blockPieces.push(`<team:${el.team_id}>`);
        break;
      case "usergroup":
        blockPieces.push(`<usergroup:${el.usergroup_id}>`);
        break;
    }
    return blockPieces;
  };

  const walkRichTextElement = (el: RichTextBlockElement) => {
    const result: string[] = [];
    switch (el.type) {
      case "rich_text_section":
      case "rich_text_quote":
        result.push(el.elements.map(walkRichTextInline).join("\n"));
        break;
      case "rich_text_list":
        result.push(el.elements.map(section => section.elements.map(walkRichTextInline).join("\n")).join("\n"));
        break;
      case "rich_text_preformatted":
        result.push(el.elements.map(walkRichTextInline).join("\n"));
        break;
    }
    return result;
  };

  const walkBlock = (block: KnownBlock) => {
    const blockPieces: string[] = [];
    switch (block.type) {
      case "section":
        if (block.text?.text) blockPieces.push(block.text.text);
        if (block.fields) {
          for (const f of block.fields) if (f.text) blockPieces.push(f.text);
        }
        if (block.accessory && "text" in block.accessory && block.accessory.text) {
          blockPieces.push(block.accessory.text.text);
        }
        break;
      case "context":
        if (Array.isArray(block.elements)) {
          block.elements.forEach(el => {
            if ("text" in el && el.text) blockPieces.push(el.text);
          });
        }
        break;
      case "header":
        if (block.text?.text) blockPieces.push(block.text.text);
        break;
      case "rich_text":
        blockPieces.push(block.elements.map(walkRichTextElement).join("\n"));
        break;
      case "markdown":
        if (block.text) blockPieces.push(block.text);
        break;
      case "video":
        if (block.title?.text) blockPieces.push(block.title.text);
        if (block.description?.text) blockPieces.push(block.description.text);
        break;
      case "image":
        if (block.title?.text) blockPieces.push(block.title.text);
        break;
      case "input":
        if (block.label?.text) blockPieces.push(block.label.text);
        if (block.hint?.text) blockPieces.push(block.hint.text);
        break;
    }
    return blockPieces;
  };

  let blockText = "";
  if (Array.isArray(m.blocks)) {
    const blockPieces = m.blocks.map(b => walkBlock(b));
    blockText = blockPieces.join("\n");
  }

  if (blockText) {
    pieces.push(blockText);
  } else if (m.text) {
    pieces.push(m.text);
  }

  if (m.attachments) {
    for (const att of m.attachments) {
      if (att.pretext) pieces.push(att.pretext);
      if (att.title) pieces.push(att.title);
      if (att.text) pieces.push(att.text);
      if (att.fields) {
        for (const f of att.fields) {
          const title = f.title?.trim() ?? "";
          const value = f.value?.trim() ?? "";
          if (title || value) {
            pieces.push(title && value ? `${title}: ${value}` : title || value);
          }
        }
      }
    }
  }

  const out = Array.from(new Set(pieces.map(s => s.trim()).filter(Boolean))).join("\n");
  return out || undefined;
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

async function fetchOneMessage(client: WebClient, channel: string, ts: string): Promise<SlackMessage | undefined> {
  const r = await queuedSlack("conversations.history", () =>
    client.conversations.history({ channel, latest: ts, inclusive: true, limit: 1 }),
  );
  const message = r.messages?.[0];
  if (!message) return undefined;
  return transformToSlackMessage(message);
}

async function fetchThread(client: WebClient, channel: string, threadTs: string) {
  const r = await queuedSlack("conversations.replies", () =>
    client.conversations.replies({ channel, ts: threadTs, limit: 20 }),
  );
  return r.messages?.map(transformToSlackMessage) ?? [];
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
  const beforeMsgs = before.messages?.map(transformToSlackMessage);
  const afterMsgs = after.messages?.map(transformToSlackMessage);
  out.push(...(beforeMsgs ?? []).reverse(), anchor, ...(afterMsgs ?? []));
  return out;
}

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
  const parts: string[] = [];
  if (scope?.trim()) parts.push(`in:${scope.trim()}`);
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
  if (!authParams.authToken) throw new Error(MISSING_AUTH_TOKEN);
  const client = new WebClient(authParams.authToken);
  const cache = new SlackUserCache(client);

  const { emails, topic, timeRange, limit = 20, channel } = params;

  const { user_id: myUserId } = await queuedSlack("auth.test", () => client.auth.test());
  if (!myUserId) throw new Error("Failed to get current user ID");
  const meInfo = await cache.get(myUserId);

  const targetIds = emails?.length ? await lookupUserIdsByEmail(client, emails, cache) : [];
  const filteredTargetIds = targetIds.filter(id => id !== myUserId);

  const allMatches: Match[] = [];
  const searchPromises: Promise<Match[]>[] = [];

  if (filteredTargetIds.length === 1) {
    searchPromises.push(searchScoped({ client, scope: `<@${filteredTargetIds[0]}>`, topic, timeRange, limit }));
  } else if (filteredTargetIds.length >= 2) {
    const searchMPIM = (async () => {
      const mpimName = await tryGetMPIMName(client, filteredTargetIds);
      return mpimName ? searchScoped({ client, scope: mpimName, topic, timeRange, limit }) : [];
    })();
    searchPromises.push(searchMPIM);
    searchPromises.push(
      ...filteredTargetIds.map(id => searchScoped({ client, scope: `<@${id}>`, topic, timeRange, limit })),
    );
  } else if (channel) {
    searchPromises.push(searchScoped({ client, scope: normalizeChannelOperand(channel), topic, timeRange, limit }));
  }
  if (topic) {
    searchPromises.push(searchScoped({ client, scope: "", topic, timeRange, limit }));
  }

  const searchResults = await Promise.all(searchPromises);
  searchResults.forEach(matches => allMatches.push(...matches));

  const channelInfoCache = new Map<string, { isIm: boolean; isMpim: boolean; members: string[] }>();
  const expandedRaw: Array<SlackSearchMessage | null> = [];

  for await (const m of allMatches) {
    if (!m.ts || !m.channel?.id) continue;
    const anchor = await fetchOneMessage(client, m.channel.id, m.ts);
    if (!anchor) continue;

    const rootTs = anchor.thread_ts || m.ts;
    let channelInfo = channelInfoCache.get(m.channel.id);

    if (!channelInfo) {
      const convoInfo = await queuedSlack("conversations.info", () =>
        // @ts-expect-error typescript cannot infer the type of the channel id within queuedSlack
        client.conversations.info({ channel: m.channel.id }),
      );
      const isIm = convoInfo.channel?.is_im ?? false;
      const isMpim = convoInfo.channel?.is_mpim ?? false;
      let members: string[] = [];
      if (isIm || isMpim) {
        const res = await queuedSlack("conversations.members", () =>
          // @ts-expect-error typescript cannot infer the type of the channel id within queuedSlack
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

    expandedRaw.push({
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

  const results = dedupeAndSort(expandedRaw.filter(Boolean) as SlackSearchMessage[]);

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
