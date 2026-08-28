import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockPost = jest.fn<(...args: any[]) => Promise<any>>();
const mockRequest = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  createAxiosClientWithRetries: () => ({
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    request: (...args: any[]) => mockRequest(...args),
  }),
}));

import {
  zendeskAddCommentToTicketParamsSchema,
  zendeskAssignTicketParamsSchema,
  zendeskCreateZendeskTicketParamsSchema,
  zendeskGetTicketDetailsParamsSchema,
  zendeskListZendeskTicketsParamsSchema,
  zendeskSearchZendeskByQueryParamsSchema,
  zendeskSearchZendeskTicketsByQueryParamsSchema,
  zendeskUpdateTicketStatusParamsSchema,
} from "../../src/actions/autogen/types";
import addCommentToTicket from "../../src/actions/providers/zendesk/addCommentToTicket";
import assignTicket from "../../src/actions/providers/zendesk/assignTicket";
import createZendeskTicket from "../../src/actions/providers/zendesk/createZendeskTicket";
import getTicketDetails from "../../src/actions/providers/zendesk/getTicketDetails";
import listZendeskTickets from "../../src/actions/providers/zendesk/listTickets";
import searchZendeskByQuery from "../../src/actions/providers/zendesk/searchZendeskByQuery";
import searchZendeskTicketsByQuery from "../../src/actions/providers/zendesk/searchZendeskTicketsByQuery";
import updateTicketStatus from "../../src/actions/providers/zendesk/updateTicketStatus";

const AUTH = { authToken: "test-token" };

describe("zendesk searchZendeskTicketsByQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a subdomain that could redirect credentials to another host", async () => {
    await expect(
      searchZendeskTicketsByQuery({
        params: {
          subdomain: "attacker.example/",
          query: "status:open",
        },
        authParams: AUTH,
      }),
    ).rejects.toThrow("Invalid Zendesk subdomain");

    expect(mockGet).not.toHaveBeenCalled();
  });

  it("rejects unsafe subdomains in every Zendesk action that constructs a tenant URL", async () => {
    const subdomain = "attacker.example/";
    const requests = [
      createZendeskTicket({
        params: { subdomain, subject: "Subject" },
        authParams: AUTH,
      }),
      listZendeskTickets({
        params: { subdomain },
        authParams: AUTH,
      }),
      getTicketDetails({
        params: { subdomain, ticketId: "1" },
        authParams: AUTH,
      }),
      updateTicketStatus({
        params: { subdomain, ticketId: "1", status: "open" },
        authParams: AUTH,
      }),
      addCommentToTicket({
        params: { subdomain, ticketId: "1", body: "Comment" },
        authParams: AUTH,
      }),
      assignTicket({
        params: {
          subdomain,
          ticketId: "1",
          assigneeEmail: "agent@example.com",
        },
        authParams: AUTH,
      }),
      searchZendeskByQuery({
        params: { subdomain, query: "status:open" },
        authParams: AUTH,
      }),
    ];

    await Promise.all(
      requests.map((request) =>
        expect(request).rejects.toThrow("Invalid Zendesk subdomain"),
      ),
    );

    expect(mockGet).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("forces ticket searches and returns compact paginated discovery records", async () => {
    const ticket = { id: 1, result_type: "ticket" };
    mockGet.mockResolvedValueOnce({
      data: {
        results: [ticket, { id: 2, result_type: "user" }],
        count: 275,
        next_page:
          "https://example-account.zendesk.com/api/v2/search.json?page=2",
      },
    });

    const result = await searchZendeskTicketsByQuery({
      params: {
        subdomain: "example-account",
        query: "type:user status:open",
        limit: 10,
      },
      authParams: AUTH,
    });

    const [requestUrl] = mockGet.mock.calls[0] as [string];
    const parsedUrl = new URL(requestUrl);
    expect(parsedUrl.hostname).toBe("example-account.zendesk.com");
    expect(parsedUrl.searchParams.get("query")).toBe("type:ticket status:open");
    expect(parsedUrl.searchParams.get("per_page")).toBe("10");
    expect(parsedUrl.searchParams.get("page")).toBe("1");
    expect(result.results).toEqual([
      expect.objectContaining({
        id: 1,
        description_excerpt: "",
        description_truncated: false,
      }),
    ]);
    expect(result.results[0]).not.toHaveProperty("result_type");
    expect(result.count).toBe(275);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.next_page).toBe(2);
  });

  it("keeps only discovery fields, populated custom fields, and description excerpts", async () => {
    const description = "x".repeat(2000);
    mockGet
      .mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 1,
              result_type: "ticket",
              subject: "Investigate this",
              description,
              status: "open",
              tags: ["support"],
              via: {
                channel: "email",
                source: { from: { address: "requester@example.com" } },
              },
              custom_fields: [
                { id: 100, value: null },
                { id: 200, value: "technical_support" },
              ],
              fields: [
                { id: 100, value: null },
                { id: 200, value: "technical_support" },
              ],
              generated_timestamp: 123,
              url: "https://example-account.zendesk.com/api/v2/tickets/1.json",
            },
          ],
          count: 1,
          next_page: null,
        },
      })
      .mockResolvedValueOnce({
        data: {
          ticket_fields: [{ id: 200, title: "Request Type" }],
          meta: { has_more: false },
        },
      });

    const result = await searchZendeskTicketsByQuery({
      params: {
        subdomain: "example-account",
        query: "status:open",
      },
      authParams: AUTH,
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
    const [ticketFieldsUrl] = mockGet.mock.calls[1] as [string];
    expect(new URL(ticketFieldsUrl).pathname).toBe(
      "/api/v2/ticket_fields.json",
    );
    expect(result.results[0]).toEqual(
      expect.objectContaining({
        id: 1,
        subject: "Investigate this",
        status: "open",
        tags: ["support"],
        via: { channel: "email" },
        description_excerpt: "x".repeat(1500),
        description_truncated: true,
        custom_fields: [
          { id: 200, name: "Request Type", value: "technical_support" },
        ],
      }),
    );
    expect(result.results[0]).not.toHaveProperty("fields");
    expect(result.results[0]).not.toHaveProperty("generated_timestamp");
    expect(result.results[0]).not.toHaveProperty("url");
    expect(result.response_truncated).toBe(true);
  });

  it("keeps the compact search response under its character budget without dropping ticket IDs", async () => {
    const tickets = Array.from({ length: 50 }, (_, index) => ({
      id: index + 1,
      result_type: "ticket",
      subject: `Ticket ${index + 1}`,
      description: "d".repeat(5000),
      tags: Array.from(
        { length: 40 },
        (_, tagIndex) => `tag-${tagIndex}-${"t".repeat(100)}`,
      ),
      custom_fields: Array.from({ length: 20 }, (_, fieldIndex) => ({
        id: fieldIndex + 1,
        value: "v".repeat(1000),
      })),
    }));
    mockGet.mockResolvedValueOnce({
      data: {
        results: tickets,
        count: tickets.length,
        next_page: null,
      },
    });

    const result = await searchZendeskTicketsByQuery({
      params: {
        subdomain: "example-account",
        query: "status:open",
        limit: 50,
        includeCustomFieldNames: false,
      },
      authParams: AUTH,
    });

    expect(result.results).toHaveLength(50);
    expect(result.results.map((ticket) => ticket.id)).toEqual(
      tickets.map((ticket) => ticket.id),
    );
    expect(JSON.stringify(result.results).length).toBeLessThanOrEqual(80000);
    expect(result.response_truncated).toBe(true);
  });

  it("returns compact list records with bounded pagination", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 1,
            result_type: "ticket",
            subject: "Listed ticket",
            description: "Summary",
          },
        ],
        count: 21,
        next_page:
          "https://example-account.zendesk.com/api/v2/search.json?page=2",
      },
    });

    const result = await listZendeskTickets({
      params: {
        subdomain: "example-account",
        status: "open",
        limit: 20,
        page: 1,
      },
      authParams: AUTH,
    });

    const [requestUrl] = mockGet.mock.calls[0] as [string];
    const parsedUrl = new URL(requestUrl);
    expect(parsedUrl.pathname).toBe("/api/v2/search.json");
    expect(parsedUrl.searchParams.get("query")).toMatch(
      /^type:ticket created>\d{4}-\d{2}-\d{2} status:open$/,
    );
    expect(parsedUrl.searchParams.get("per_page")).toBe("20");
    expect(parsedUrl.searchParams.get("page")).toBe("1");
    expect(result.tickets).toEqual([
      expect.objectContaining({
        id: 1,
        subject: "Listed ticket",
        description_excerpt: "Summary",
      }),
    ]);
    expect(result.returned_count).toBe(1);
    expect(result.has_more).toBe(true);
    expect(result.next_page).toBe(2);
  });

  it("validates the subdomain in every generated Zendesk parameter schema", () => {
    const schemaCases: Array<{
      schema: { safeParse: (input: unknown) => { success: boolean } };
      params: Record<string, unknown>;
    }> = [
      {
        schema: zendeskCreateZendeskTicketParamsSchema,
        params: { subject: "Subject" },
      },
      { schema: zendeskListZendeskTicketsParamsSchema, params: {} },
      {
        schema: zendeskGetTicketDetailsParamsSchema,
        params: { ticketId: "1" },
      },
      {
        schema: zendeskUpdateTicketStatusParamsSchema,
        params: { ticketId: "1", status: "open" },
      },
      {
        schema: zendeskAddCommentToTicketParamsSchema,
        params: { ticketId: "1", body: "Comment" },
      },
      {
        schema: zendeskAssignTicketParamsSchema,
        params: { ticketId: "1", assigneeEmail: "agent@example.com" },
      },
      {
        schema: zendeskSearchZendeskByQueryParamsSchema,
        params: { query: "status:open" },
      },
      {
        schema: zendeskSearchZendeskTicketsByQueryParamsSchema,
        params: { query: "status:open" },
      },
    ];

    for (const { schema, params } of schemaCases) {
      expect(
        schema.safeParse({ ...params, subdomain: "example-account" }).success,
      ).toBe(true);
      expect(
        schema.safeParse({ ...params, subdomain: "attacker.example/" }).success,
      ).toBe(false);
    }
  });
});
