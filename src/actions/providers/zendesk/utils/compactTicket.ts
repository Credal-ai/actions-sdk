import type { AxiosInstance } from "axios";
import type { zendeskListZendeskTicketsOutputType } from "../../../autogen/types.js";

const DESCRIPTION_EXCERPT_CHARACTERS = 1500;
const MAX_TAGS = 30;
const MAX_TAG_CHARACTERS = 100;
const MAX_CUSTOM_FIELD_VALUE_CHARACTERS = 1000;
const MAX_CUSTOM_FIELDS_CHARACTERS_PER_TICKET = 6000;
const MAX_DISCOVERY_RESPONSE_CHARACTERS = 80000;
const MAX_TICKET_FIELD_PAGES = 10;

type CompactTicket = zendeskListZendeskTicketsOutputType["tickets"][number];

interface RawZendeskTicket extends Record<string, unknown> {
  custom_fields?: unknown;
  description?: unknown;
  fields?: unknown;
  id?: unknown;
  tags?: unknown;
  via?: unknown;
}

interface RawCustomField {
  id?: unknown;
  value?: unknown;
}

interface RawTicketFieldDefinition {
  id?: unknown;
  title?: unknown;
}

interface TicketFieldsResponse {
  ticket_fields?: unknown;
  meta?: {
    after_cursor?: unknown;
    has_more?: unknown;
  };
}

export async function getTicketFieldNames({
  tickets,
  zendeskBaseUrl,
  authToken,
  axiosClient,
}: {
  tickets: unknown[];
  zendeskBaseUrl: URL;
  authToken: string;
  axiosClient: AxiosInstance;
}): Promise<Map<number, string>> {
  if (!tickets.some(hasPopulatedCustomFields)) {
    return new Map();
  }

  const fieldNames = new Map<number, string>();
  const apiEndpoint = new URL("/api/v2/ticket_fields.json", zendeskBaseUrl);
  apiEndpoint.searchParams.set("page[size]", "100");

  try {
    for (let page = 0; page < MAX_TICKET_FIELD_PAGES; page += 1) {
      const response = await axiosClient.get<TicketFieldsResponse>(apiEndpoint.toString(), {
        headers: zendeskHeaders(authToken),
      });
      const definitions = Array.isArray(response.data.ticket_fields) ? response.data.ticket_fields : [];

      for (const definition of definitions) {
        if (!isRecord(definition)) continue;
        const { id, title } = definition as RawTicketFieldDefinition;
        if (typeof id === "number" && typeof title === "string") {
          fieldNames.set(id, title);
        }
      }

      const hasMore = response.data.meta?.has_more === true;
      const afterCursor = response.data.meta?.after_cursor;
      if (!hasMore || typeof afterCursor !== "string" || afterCursor.length === 0) {
        break;
      }
      apiEndpoint.searchParams.set("page[after]", afterCursor);
    }
  } catch {
    // Field names improve discovery but should not make the ticket search fail.
    return fieldNames;
  }

  return fieldNames;
}

export function compactZendeskTickets({
  tickets,
  fieldNames = new Map(),
}: {
  tickets: unknown[];
  fieldNames?: Map<number, string>;
}): { tickets: CompactTicket[]; responseTruncated: boolean } {
  const compactTickets = tickets.flatMap(ticket => {
    const compactTicket = compactZendeskTicket(ticket, fieldNames);
    return compactTicket ? [compactTicket] : [];
  });

  return enforceResponseBudget(compactTickets);
}

function compactZendeskTicket(ticket: unknown, fieldNames: Map<number, string>): CompactTicket | undefined {
  if (!isRecord(ticket) || typeof ticket.id !== "number") {
    return undefined;
  }

  const id = ticket.id;
  const rawTicket = ticket as RawZendeskTicket;
  const description = typeof rawTicket.description === "string" ? rawTicket.description : "";
  const compactTags = compactTicketTags(rawTicket.tags);
  const compactCustomFields = compactTicketCustomFields(rawTicket.custom_fields, fieldNames);
  const channel =
    isRecord(rawTicket.via) && typeof rawTicket.via.channel === "string" ? rawTicket.via.channel : undefined;

  return {
    id,
    subject: nullableString(rawTicket.subject),
    status: nullableString(rawTicket.status),
    custom_status_id: nullableNumber(rawTicket.custom_status_id),
    type: nullableString(rawTicket.type),
    priority: nullableString(rawTicket.priority),
    created_at: nullableString(rawTicket.created_at),
    updated_at: nullableString(rawTicket.updated_at),
    requester_id: nullableNumber(rawTicket.requester_id),
    assignee_id: nullableNumber(rawTicket.assignee_id),
    group_id: nullableNumber(rawTicket.group_id),
    organization_id: nullableNumber(rawTicket.organization_id),
    brand_id: nullableNumber(rawTicket.brand_id),
    ticket_form_id: nullableNumber(rawTicket.ticket_form_id),
    ...(compactTags.tags.length > 0 ? { tags: compactTags.tags } : {}),
    tags_truncated: compactTags.truncated,
    ...(channel ? { via: { channel } } : {}),
    description_excerpt: description.slice(0, DESCRIPTION_EXCERPT_CHARACTERS),
    description_truncated: description.length > DESCRIPTION_EXCERPT_CHARACTERS,
    ...(compactCustomFields.fields.length > 0 ? { custom_fields: compactCustomFields.fields } : {}),
    custom_fields_truncated: compactCustomFields.truncated,
  };
}

function compactTicketTags(value: unknown): { tags: string[]; truncated: boolean } {
  if (!Array.isArray(value)) {
    return { tags: [], truncated: false };
  }

  const stringTags = value.filter((tag): tag is string => typeof tag === "string");
  const tags = stringTags.slice(0, MAX_TAGS).map(tag => tag.slice(0, MAX_TAG_CHARACTERS));
  const truncated =
    stringTags.length > MAX_TAGS ||
    stringTags.some((tag, index) => index < MAX_TAGS && tag.length > MAX_TAG_CHARACTERS);

  return { tags, truncated };
}

function compactTicketCustomFields(
  value: unknown,
  fieldNames: Map<number, string>,
): { fields: Array<Record<string, unknown>>; truncated: boolean } {
  if (!Array.isArray(value)) {
    return { fields: [], truncated: false };
  }

  const fields: Array<Record<string, unknown>> = [];
  let serializedCharacters = 2;
  let truncated = false;

  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const field = candidate as RawCustomField;
    if (typeof field.id !== "number" || field.value === null || field.value === undefined) continue;

    const compactValue = compactCustomFieldValue(field.value);
    const compactField: Record<string, unknown> = {
      id: field.id,
      ...(fieldNames.has(field.id) ? { name: fieldNames.get(field.id) } : {}),
      value: compactValue.value,
    };
    const fieldCharacters = JSON.stringify(compactField).length + 1;

    if (serializedCharacters + fieldCharacters > MAX_CUSTOM_FIELDS_CHARACTERS_PER_TICKET) {
      truncated = true;
      continue;
    }

    fields.push(compactField);
    serializedCharacters += fieldCharacters;
    truncated ||= compactValue.truncated;
  }

  return { fields, truncated };
}

function compactCustomFieldValue(value: unknown): { value: unknown; truncated: boolean } {
  if (typeof value === "string") {
    return {
      value: value.slice(0, MAX_CUSTOM_FIELD_VALUE_CHARACTERS),
      truncated: value.length > MAX_CUSTOM_FIELD_VALUE_CHARACTERS,
    };
  }

  const serializedValue = safelySerialize(value);
  if (serializedValue.length <= MAX_CUSTOM_FIELD_VALUE_CHARACTERS) {
    return { value, truncated: false };
  }

  return {
    value: serializedValue.slice(0, MAX_CUSTOM_FIELD_VALUE_CHARACTERS),
    truncated: true,
  };
}

function enforceResponseBudget(tickets: CompactTicket[]): {
  tickets: CompactTicket[];
  responseTruncated: boolean;
} {
  let responseTruncated = tickets.some(
    ticket => ticket.description_truncated || ticket.custom_fields_truncated || ticket.tags_truncated,
  );

  while (JSON.stringify(tickets).length > MAX_DISCOVERY_RESPONSE_CHARACTERS) {
    const ticketWithCustomFields = tickets
      .filter(ticket => ticket.custom_fields && ticket.custom_fields.length > 0)
      .sort((left, right) => (right.custom_fields?.length ?? 0) - (left.custom_fields?.length ?? 0))[0];
    if (ticketWithCustomFields?.custom_fields?.length) {
      ticketWithCustomFields.custom_fields.pop();
      ticketWithCustomFields.custom_fields_truncated = true;
      if (ticketWithCustomFields.custom_fields.length === 0) {
        delete ticketWithCustomFields.custom_fields;
      }
      responseTruncated = true;
      continue;
    }

    const ticketWithTags = tickets
      .filter(ticket => ticket.tags && ticket.tags.length > 0)
      .sort((left, right) => (right.tags?.length ?? 0) - (left.tags?.length ?? 0))[0];
    if (ticketWithTags?.tags?.length) {
      ticketWithTags.tags.pop();
      ticketWithTags.tags_truncated = true;
      if (ticketWithTags.tags.length === 0) {
        delete ticketWithTags.tags;
      }
      responseTruncated = true;
      continue;
    }

    const ticketWithDescription = tickets
      .filter(ticket => ticket.description_excerpt.length > 250)
      .sort((left, right) => right.description_excerpt.length - left.description_excerpt.length)[0];
    if (ticketWithDescription) {
      ticketWithDescription.description_excerpt = ticketWithDescription.description_excerpt.slice(
        0,
        Math.max(250, ticketWithDescription.description_excerpt.length - 250),
      );
      ticketWithDescription.description_truncated = true;
      responseTruncated = true;
      continue;
    }

    const ticketWithLongSubject = tickets
      .filter(ticket => typeof ticket.subject === "string" && ticket.subject.length > 100)
      .sort((left, right) => (right.subject?.length ?? 0) - (left.subject?.length ?? 0))[0];
    if (ticketWithLongSubject && typeof ticketWithLongSubject.subject === "string") {
      ticketWithLongSubject.subject = ticketWithLongSubject.subject.slice(
        0,
        Math.max(100, ticketWithLongSubject.subject.length - 100),
      );
      responseTruncated = true;
      continue;
    }

    break;
  }

  return { tickets, responseTruncated };
}

function hasPopulatedCustomFields(ticket: unknown): boolean {
  return (
    isRecord(ticket) &&
    Array.isArray(ticket.custom_fields) &&
    ticket.custom_fields.some(
      field => isRecord(field) && typeof field.id === "number" && field.value !== null && field.value !== undefined,
    )
  );
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function safelySerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function zendeskHeaders(authToken: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
