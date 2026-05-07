import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
  buildEmailMessageActivityIdQuery,
  buildEmailMessageQuery,
  cleanBody,
  compareTaskEmailRecords,
  detectTaskDirection,
  normalizeLimit,
  parseExcludeActivityIds,
  soqlQuery,
  validateWhereClause,
} from "./getCleanActivityRecords.js";
import getCleanActivityRecords from "./getCleanActivityRecords.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../util/axiosClient.js", () => ({
  ApiError: class ApiError extends Error {
    data?: unknown;
  },
  axiosClient: { get: (...args: any[]) => mockGet(...args) },
}));

beforeEach(() => {
  mockGet.mockReset();
});

describe("salesforceGetCleanActivityRecords non-Groove Task body cleaning", () => {
  test("strips Body: label from Salesforce Gmail extension format", () => {
    const desc = [
      "To: jason@powersproptech.com",
      "CC: ",
      "BCC: ",
      "Attachment: --none--",
      "",
      "Subject: Re: ButterflyMX Installation Next Steps: 80 Waterfront Blvd",
      "Body:",
      "Hey Jason,",
      "Thomas here, I hope you're having an excellent week.",
      "",
    ].join("\n");

    const result = cleanBody(desc);
    expect(result).not.toContain("Body:");
    expect(result).toContain("Hey Jason");
    expect(result).not.toContain("To:");
    expect(result).not.toContain("Subject:");
  });

  test("strips Additional To: label from BCC-to-Salesforce format", () => {
    const desc = [
      "Additional To: thehouselandlord@gmail.com",
      "CC: ",
      "BCC: ",
      "Attachment: ",
      "",
      "Subject: ButterflyMX Case #00927715 - Re: Invoice",
      "Body:",
      "Thank you for reaching out to the ButterflyMX Customer Experience Team!",
      "",
    ].join("\n");

    const result = cleanBody(desc);
    expect(result).not.toContain("Additional To:");
    expect(result).not.toContain("Body:");
    expect(result).toContain("Thank you for reaching out");
  });
});

describe("salesforceGetCleanActivityRecords non-Groove Task direction detection", () => {
  test("detects outbound from To: header when owner is the sender", () => {
    const desc = "To: jason@powersproptech.com\nCC: \nBCC: \n\nSubject: Re: Install\nBody:\nHey Jason";
    expect(detectTaskDirection("Email: Re: Install", desc, "thomas.sigler@butterflymx.com")).toBe("outbound");
  });

  test("detects inbound from To: header when owner is the recipient", () => {
    const desc = "To: thomas.sigler@butterflymx.com\nCC: \nBCC: \n\nSubject: Re: Install\nBody:\nHey Thomas";
    expect(detectTaskDirection("Email: Re: Install", desc, "thomas.sigler@butterflymx.com")).toBe("inbound");
  });

  test("returns unknown when no direction signals and no ownerEmail", () => {
    const desc = "To: jason@powersproptech.com\nCC: \n\nSome body text";
    expect(detectTaskDirection("Email: Re: Install", desc, null)).toBe("unknown");
  });

  test("still detects Groove outbound from >> subject marker", () => {
    const desc = "From: rep@example.com\nTo: customer@example.com\n\nHey there";
    expect(detectTaskDirection("Email: >> Re: Proposal", desc, "rep@example.com")).toBe("outbound");
  });

  test("still detects Groove inbound from << subject marker", () => {
    const desc = "From: customer@example.com\nTo: rep@example.com\n\nHey there";
    expect(detectTaskDirection("Email: << [Inbox] - Re: Proposal", desc, "rep@example.com")).toBe("inbound");
  });
});

describe("salesforceGetCleanActivityRecords Task email chronology", () => {
  test("orders email Task records by standard ActivityDate instead of custom fields or sync timestamps", () => {
    const olderEmailSyncedLater = {
      Id: "00T000000000001AAA",
      Subject: "Email: >> Pricing follow-up",
      ActivityDate: "2026-04-01",
      CreatedDate: "2026-05-06T14:00:00.000+0000",
      LastModifiedDate: "2026-05-06T14:00:00.000+0000",
    };
    const newerEmailSyncedEarlier = {
      Id: "00T000000000002AAA",
      Subject: "Email: >> Pricing follow-up",
      ActivityDate: "2026-05-05",
      CreatedDate: "2026-05-05T16:00:00.000+0000",
      LastModifiedDate: "2026-05-05T16:00:00.000+0000",
    };

    const sorted = [olderEmailSyncedLater, newerEmailSyncedEarlier].sort(compareTaskEmailRecords);

    expect(sorted[0]?.Id).toBe("00T000000000002AAA");
  });
});

describe("salesforceGetCleanActivityRecords EmailMessage exclusions", () => {
  test("rejects excludeActivityIds on EmailMessage instead of silently ignoring it", async () => {
    await expect(
      getCleanActivityRecords({
        params: {
          objectType: "EmailMessage",
          whereClause: "RelatedToId = '500Qp0000012345AAA'",
          excludeActivityIds: JSON.stringify(["00T000000000001AAA"]),
        },
        authParams: {
          authToken: "token",
          baseUrl: "https://example.my.salesforce.com",
        },
      }),
    ).resolves.toMatchObject({
      success: false,
      error: "excludeActivityIds is only supported when objectType is Task",
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  test("builds a separate uncapped ActivityId query from the same EmailMessage filter", () => {
    const soql = buildEmailMessageActivityIdQuery("RelatedToId = '500Qp0000012345AAA'");

    expect(soql).toBe(
      "SELECT ActivityId FROM EmailMessage WHERE (RelatedToId = '500Qp0000012345AAA') AND ActivityId != null",
    );
    expect(soql).not.toContain("LIMIT");
    expect(soql).not.toContain("TextBody");
  });

  test("keeps EmailMessageRelation semi-joins at the top level when date filters are present", () => {
    const whereClause =
      "Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z";

    expect(buildEmailMessageQuery(whereClause, 100)).toContain(
      "FROM EmailMessage WHERE Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z ORDER BY",
    );
    expect(buildEmailMessageActivityIdQuery(whereClause)).toBe(
      "SELECT ActivityId FROM EmailMessage WHERE Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z AND ActivityId != null",
    );
  });

  test("unwraps agent-supplied parentheses around EmailMessageRelation semi-joins", () => {
    const whereClause =
      "(Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0')) AND MessageDate >= 2026-01-01T00:00:00Z";

    expect(buildEmailMessageQuery(whereClause, 100)).toContain(
      "FROM EmailMessage WHERE Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z ORDER BY",
    );
  });

  test("unwraps parenthesized semi-joins with nested parentheses inside the subquery", () => {
    const whereClause =
      "(Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId IN ('003Qp00000cMnCQIA0', '003Qp00000cMnCQIA1'))) AND MessageDate >= 2026-01-01T00:00:00Z";

    expect(buildEmailMessageQuery(whereClause, 100)).toContain(
      "FROM EmailMessage WHERE Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId IN ('003Qp00000cMnCQIA0', '003Qp00000cMnCQIA1')) AND MessageDate >= 2026-01-01T00:00:00Z ORDER BY",
    );
  });

  test("rejects malformed excludeActivityIds JSON", () => {
    expect(() => parseExcludeActivityIds("not-json")).toThrow("excludeActivityIds must be a JSON array string");
  });

  test("rejects non-Salesforce IDs instead of silently dropping them", () => {
    expect(() => parseExcludeActivityIds(JSON.stringify(["00T000000000001AAA", "bad-id"]))).toThrow(
      "excludeActivityIds contains invalid Salesforce IDs: bad-id",
    );
  });

  test("returns valid unique Salesforce IDs", () => {
    expect(parseExcludeActivityIds(JSON.stringify(["00T000000000001AAA", "00T000000000001AAA"]))).toEqual([
      "00T000000000001AAA",
    ]);
  });
});

describe("salesforceGetCleanActivityRecords Task filters", () => {
  test("only queries completed email Tasks", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        records: [],
        done: true,
      },
    });

    await getCleanActivityRecords({
      params: {
        objectType: "Task",
        whereClause: "WhatId = 'a3bQp000001h4J7IAI'",
      },
      authParams: {
        authToken: "token",
        baseUrl: "https://example.my.salesforce.com",
      },
    });

    const requestUrl = String(mockGet.mock.calls[0]?.[0]);
    const soql = decodeURIComponent(new URL(requestUrl).searchParams.get("q") ?? "");
    expect(soql).toContain("TaskSubtype = 'Email'");
    expect(soql).toContain("Status = 'Completed'");
    expect(soql).toContain("CompletedDateTime");
    expect(soql).toContain("ORDER BY ActivityDate DESC NULLS LAST, CompletedDateTime DESC NULLS LAST");
    expect(soql).not.toContain("__c");
  });

  test("uses an optional Task DateTime tie-breaker field for Groove-style same-day email chronology", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          records: [{ QualifiedApiName: "groove_email_sent_at__c", DataType: "Date/Time" }],
          done: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          records: [
            {
              Id: "00T000000000001AAA",
              Subject: "Email: >> Re: ButterflyMX Inquiry",
              ActivityDate: "2026-05-05",
              CompletedDateTime: "2026-05-05T20:00:00.000+0000",
              groove_email_sent_at__c: "2026-05-05T10:00:00.000+0000",
              Description: "From: rep@example.com\nTo: customer@example.com\n\nEarlier reply",
            },
            {
              Id: "00T000000000002AAA",
              Subject: "Email: >> Re: ButterflyMX Inquiry",
              ActivityDate: "2026-05-05",
              CompletedDateTime: "2026-05-05T19:00:00.000+0000",
              groove_email_sent_at__c: "2026-05-05T15:00:00.000+0000",
              Description: "From: rep@example.com\nTo: customer@example.com\n\nLater reply",
            },
          ],
          done: true,
        },
      });

    const result = await getCleanActivityRecords({
      params: {
        objectType: "Task",
        whereClause: "WhatId = 'a3bQp000001h4J7IAI'",
        taskDateTimeTieBreakerField: "groove_email_sent_at__c",
      },
      authParams: {
        authToken: "token",
        baseUrl: "https://example.my.salesforce.com",
      },
    });

    const taskRequestUrl = String(mockGet.mock.calls[1]?.[0]);
    const taskSoql = decodeURIComponent(new URL(taskRequestUrl).searchParams.get("q") ?? "");
    expect(taskSoql).toContain("groove_email_sent_at__c");
    expect(taskSoql).toContain(
      "ORDER BY ActivityDate DESC NULLS LAST, groove_email_sent_at__c DESC NULLS LAST, CompletedDateTime DESC NULLS LAST",
    );
    expect(result).toMatchObject({
      success: true,
      threads: [{ latestTaskId: "00T000000000002AAA", latestDate: "2026-05-05T15:00:00.000+0000" }],
    });
  });

  test("rejects optional Task tie-breaker fields that are not Salesforce DateTime fields", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        records: [{ QualifiedApiName: "Some_Date__c", DataType: "Date" }],
        done: true,
      },
    });

    await expect(
      getCleanActivityRecords({
        params: {
          objectType: "Task",
          whereClause: "WhatId = 'a3bQp000001h4J7IAI'",
          taskDateTimeTieBreakerField: "Some_Date__c",
        },
        authParams: {
          authToken: "token",
          baseUrl: "https://example.my.salesforce.com",
        },
      }),
    ).resolves.toMatchObject({
      success: false,
      error: "taskDateTimeTieBreakerField must reference a Task Date/Time field",
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe("salesforceGetCleanActivityRecords input guards", () => {
  test("allows disallowed SOQL guard sequences inside quoted string literals", () => {
    expect(() =>
      validateWhereClause("Subject LIKE '%Q2--Q3%' AND Description LIKE '%/* note */%' AND Subject != ';'"),
    ).not.toThrow();
  });

  test("rejects disallowed SOQL guard sequences outside quoted string literals", () => {
    expect(() => validateWhereClause("Subject LIKE '%Q2%' -- ignored")).toThrow(
      "whereClause contains disallowed patterns",
    );
  });

  test("rejects unbalanced parentheses that could break appended filters", () => {
    expect(() => validateWhereClause("1=1) OR (1=1")).toThrow("whereClause contains unbalanced parentheses");
    expect(() => validateWhereClause("Subject LIKE '%(safe)%' AND WhoId = '003Qp00000cMnCQIA0'")).not.toThrow();
  });

  test("floors negative and zero limits at one", () => {
    expect(normalizeLimit(-5)).toBe(1);
    expect(normalizeLimit(0)).toBe(1);
    expect(normalizeLimit(200)).toBe(100);
    expect(normalizeLimit(undefined)).toBe(20);
  });
});

describe("salesforceGetCleanActivityRecords Salesforce query pagination", () => {
  test("follows Salesforce nextRecordsUrl pages", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          records: [{ Id: "02sQp0000000001AAA" }],
          done: false,
          nextRecordsUrl: "/services/data/v56.0/query/01gQp0000000001-2000",
        },
      })
      .mockResolvedValueOnce({
        data: {
          records: [{ Id: "02sQp0000000002AAA" }],
          done: true,
        },
      });

    await expect(
      soqlQuery("https://example.my.salesforce.com", "token", "SELECT Id FROM EmailMessage"),
    ).resolves.toEqual([{ Id: "02sQp0000000001AAA" }, { Id: "02sQp0000000002AAA" }]);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[1]?.[0]).toBe(
      "https://example.my.salesforce.com/services/data/v56.0/query/01gQp0000000001-2000",
    );
  });
});
