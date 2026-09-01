import type { zendeskListZendeskTicketsOutputType } from "../../../autogen/types.js";

const DESCRIPTION_EXCERPT_CHARACTERS = 1000;

type CompactTicket = zendeskListZendeskTicketsOutputType["tickets"][number];

export interface ZendeskTicketSearchResult {
  id: number;
  result_type: "ticket";
  subject?: string | null;
  status?: string | null;
  type?: string | null;
  priority?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  description?: string | null;
}

/**
 * Narrows an unknown Zendesk Search API result to the ticket fields used for discovery.
 */
export function isZendeskTicketSearchResult(value: unknown): value is ZendeskTicketSearchResult {
  if (typeof value !== "object" || value === null) return false;

  const result = value as Partial<ZendeskTicketSearchResult>;
  return (
    typeof result.id === "number" &&
    result.result_type === "ticket" &&
    isOptionalNullableString(result.subject) &&
    isOptionalNullableString(result.status) &&
    isOptionalNullableString(result.type) &&
    isOptionalNullableString(result.priority) &&
    isOptionalNullableString(result.created_at) &&
    isOptionalNullableString(result.updated_at) &&
    isOptionalNullableString(result.description)
  );
}

/**
 * Projects Zendesk tickets into small records for choosing which IDs to fetch with getTicketDetails.
 */
export function compactZendeskTickets(tickets: ZendeskTicketSearchResult[]): CompactTicket[] {
  return tickets.map(ticket => {
    const description = ticket.description ?? "";

    return {
      id: ticket.id,
      subject: ticket.subject ?? null,
      status: ticket.status ?? null,
      type: ticket.type ?? null,
      priority: ticket.priority ?? null,
      created_at: ticket.created_at ?? null,
      updated_at: ticket.updated_at ?? null,
      description_excerpt: description.slice(0, DESCRIPTION_EXCERPT_CHARACTERS),
      description_truncated: description.length > DESCRIPTION_EXCERPT_CHARACTERS,
    };
  });
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}
