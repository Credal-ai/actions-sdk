import { beforeEach, describe, expect, it, jest } from "@jest/globals";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  createAxiosClientWithRetries: () => ({
    get: (...args: any[]) => mockGet(...args),
  }),
}));

import { zendeskSearchZendeskTicketsByQueryParamsSchema } from "../../src/actions/autogen/types";
import searchZendeskTicketsByQuery from "../../src/actions/providers/zendesk/searchZendeskTicketsByQuery";

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

  it("validates the subdomain in the generated parameter schema", () => {
    expect(
      zendeskSearchZendeskTicketsByQueryParamsSchema.safeParse({
        subdomain: "example-account",
        query: "status:open",
      }).success,
    ).toBe(true);
    expect(
      zendeskSearchZendeskTicketsByQueryParamsSchema.safeParse({
        subdomain: "attacker.example/",
        query: "status:open",
      }).success,
    ).toBe(false);
  });
});
