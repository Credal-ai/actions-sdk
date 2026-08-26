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

  it("forces ticket searches, filters non-ticket results, and preserves the total count", async () => {
    const ticket = { id: 1, result_type: "ticket" };
    mockGet.mockResolvedValueOnce({
      data: {
        results: [ticket, { id: 2, result_type: "user" }],
        count: 275,
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
    expect(result.results).toEqual([ticket]);
    expect(result.count).toBe(275);
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
