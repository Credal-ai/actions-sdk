import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import getChangeRequests from "../../src/actions/providers/servicenow/getChangeRequests";
import getIncidents from "../../src/actions/providers/servicenow/getIncidents";
import getRecordsByQuery from "../../src/actions/providers/servicenow/getRecordsByQuery";
import getSCTasks from "../../src/actions/providers/servicenow/getSCTasks";
import getVIPTickets from "../../src/actions/providers/servicenow/getVIPTickets";
import {
  computeTimeToClosureMinutes,
  queryServiceNowTable,
} from "../../src/actions/providers/servicenow/utils/tableQuery";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: { get: (...args: any[]) => mockGet(...args) },
  ApiError: class ApiError extends Error {},
}));

const AUTH = {
  authToken: "test-token",
  baseUrl: "https://example.service-now.com/",
};

function mockRecords(records: Record<string, string>[]) {
  mockGet.mockResolvedValueOnce({ data: { result: records } });
}

function requestedUrl(): URL {
  return new URL(mockGet.mock.calls[0][0] as string);
}

describe("ServiceNow table query helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a safe Table API request and caps the limit", async () => {
    mockRecords([]);

    const result = await queryServiceNowTable({
      authParams: AUTH,
      tableName: "incident",
      fields: ["number"],
      additionalFields: ["u_program_office"],
      baseFilter: "active=true",
      filter: "priority=1",
      limit: 100000,
      offset: 5,
    });

    expect(result).toEqual({ records: [] });
    const url = requestedUrl();
    expect(url.pathname).toBe("/api/now/table/incident");
    expect(url.searchParams.get("sysparm_limit")).toBe("10000");
    expect(url.searchParams.get("sysparm_offset")).toBe("5");
    expect(url.searchParams.get("sysparm_query")).toBe(
      "active=true^priority=1",
    );
    expect(url.searchParams.get("sysparm_fields")).toBe(
      "number,u_program_office",
    );
    expect(url.searchParams.get("sysparm_display_value")).toBe("true");
    expect(url.searchParams.get("sysparm_exclude_reference_link")).toBe("true");
    expect(mockGet.mock.calls[0][1]).toEqual({
      headers: {
        Accept: "application/json",
        Authorization: "Bearer test-token",
      },
    });
  });

  it("returns an empty array when ServiceNow returns a non-array result", async () => {
    mockGet.mockResolvedValueOnce({ data: { result: null } });

    const result = await queryServiceNowTable({
      authParams: AUTH,
      tableName: "incident",
      fields: ["number"],
    });

    expect(result).toEqual({ records: [] });
  });

  it("rejects missing authentication before making a request", async () => {
    const result = await queryServiceNowTable({
      authParams: {},
      tableName: "incident",
      fields: ["number"],
    });

    expect(result).toEqual({
      error: "authToken and baseUrl are required for the ServiceNow API",
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("calculates time to closure and ignores invalid date ranges", () => {
    expect(
      computeTimeToClosureMinutes(
        "2026-01-01T10:00:00Z",
        "2026-01-01T11:30:00Z",
      ),
    ).toBe(90);
    expect(
      computeTimeToClosureMinutes(
        "2026-01-01T11:30:00Z",
        "2026-01-01T10:00:00Z",
      ),
    ).toBeUndefined();
    expect(
      computeTimeToClosureMinutes("invalid", "2026-01-01T10:00:00Z"),
    ).toBeUndefined();
    expect(computeTimeToClosureMinutes("2026-01-01T10:00:00Z")).toBeUndefined();
  });
});

describe("ServiceNow actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries arbitrary records with plain scalar values by default", async () => {
    mockRecords([{ number: "INC001", active: "true" }]);

    const result = await getRecordsByQuery({
      authParams: AUTH,
      params: {
        tableName: "incident",
        query: "active=true",
        fields: ["number", "active"],
      },
    });

    expect(result).toEqual({
      success: true,
      records: [{ number: "INC001", active: "true" }],
    });
    const url = requestedUrl();
    expect(url.searchParams.get("sysparm_display_value")).toBe("false");
    expect(url.searchParams.get("sysparm_exclude_reference_link")).toBe("true");
  });

  it("returns an empty records array when a generic query receives a non-array result", async () => {
    mockGet.mockResolvedValueOnce({ data: { result: null } });

    const result = await getRecordsByQuery({
      authParams: AUTH,
      params: { tableName: "incident" },
    });

    expect(result).toEqual({ success: true, records: [] });
  });

  it("maps incident fields and custom fields", async () => {
    mockRecords([
      {
        number: "INC001",
        caller_id: "VIP User",
        assigned_to: "Agent One",
        assignment_group: "Service Desk",
        short_description: "Cannot connect",
        description: "VPN is unavailable",
        state: "Resolved",
        incident_state: "Resolved",
        priority: "1 - Critical",
        impact: "1 - High",
        urgency: "1 - High",
        opened_at: "2026-01-01T10:00:00Z",
        sys_updated_on: "2026-01-01T11:00:00Z",
        closed_at: "2026-01-01T11:30:00Z",
        work_notes: "Restarted gateway",
        comments: "Service restored",
        u_program_office: "Technology",
      },
    ]);

    const result = await getIncidents({
      authParams: AUTH,
      params: { additionalFields: ["u_program_office"] },
    });

    expect(result.success).toBe(true);
    expect(result.records?.[0]).toMatchObject({
      number: "INC001",
      caller: "VIP User",
      assignee: "Agent One",
      state: "Resolved",
      timeToClosureMinutes: 90,
      extraFields: { u_program_office: "Technology" },
    });
    expect(requestedUrl().pathname).toBe("/api/now/table/incident");
  });

  it("maps change request fields", async () => {
    mockRecords([
      {
        number: "CHG001",
        requested_by: "Requestor One",
        assigned_to: "Agent One",
        assignment_group: "Change Team",
        short_description: "Upgrade database",
        description: "Apply database upgrade",
        state: "Closed",
        priority: "2 - High",
        impact: "2 - Medium",
        urgency: "2 - Medium",
        opened_at: "2026-01-01T10:00:00Z",
        sys_updated_on: "2026-01-01T12:00:00Z",
        closed_at: "2026-01-01T12:00:00Z",
        work_notes: "Upgrade completed",
        comments: "Validated",
      },
    ]);

    const result = await getChangeRequests({ authParams: AUTH, params: {} });

    expect(result.success).toBe(true);
    expect(result.records?.[0]).toMatchObject({
      number: "CHG001",
      requestor: "Requestor One",
      assignmentGroup: "Change Team",
      timeToClosureMinutes: 120,
    });
    expect(requestedUrl().pathname).toBe("/api/now/table/change_request");
  });

  it("maps SCTASK fields and its parent RITM number", async () => {
    mockRecords([
      {
        number: "SCTASK001",
        request_item: "RITM001",
        assigned_to: "Agent One",
        assignment_group: "Fulfillment",
        short_description: "Provision laptop",
        description: "Prepare standard laptop",
        state: "Closed Complete",
        priority: "3 - Moderate",
        opened_at: "2026-01-01T10:00:00Z",
        sys_updated_on: "2026-01-01T10:45:00Z",
        closed_at: "2026-01-01T10:45:00Z",
        work_notes: "Laptop provisioned",
        comments: "Ready for pickup",
      },
    ]);

    const result = await getSCTasks({ authParams: AUTH, params: {} });

    expect(result.success).toBe(true);
    expect(result.records?.[0]).toMatchObject({
      number: "SCTASK001",
      ritmNumber: "RITM001",
      assignmentGroup: "Fulfillment",
      timeToClosureMinutes: 45,
    });
    expect(requestedUrl().pathname).toBe("/api/now/table/sc_task");
  });

  it.each([
    {
      ticketType: "incident" as const,
      sourceUserField: "caller_id",
      vipUser: "VIP Caller",
      expectedFilter: "caller_id.vip=true^state=7",
    },
    {
      ticketType: "sc_task" as const,
      sourceUserField: "request_item.requested_for",
      vipUser: "VIP Requester",
      expectedFilter: "request_item.requested_for.vip=true^state=7",
    },
  ])(
    "queries and maps VIP $ticketType tickets",
    async ({ ticketType, sourceUserField, vipUser, expectedFilter }) => {
      mockRecords([
        {
          number: ticketType === "incident" ? "INC001" : "SCTASK001",
          request_item: "RITM001",
          [sourceUserField]: vipUser,
          opened_at: "2026-01-01T10:00:00Z",
          closed_at: "2026-01-01T11:00:00Z",
        },
      ]);

      const result = await getVIPTickets({
        authParams: AUTH,
        params: { ticketType, query: "state=7" },
      });

      expect(result.success).toBe(true);
      expect(result.records?.[0]).toMatchObject({
        ticketType,
        vipUser,
        timeToClosureMinutes: 60,
      });
      expect(requestedUrl().searchParams.get("sysparm_query")).toBe(
        expectedFilter,
      );
    },
  );
});
