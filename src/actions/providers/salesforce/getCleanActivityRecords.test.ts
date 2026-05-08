import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
  buildEmailMessageActivityIdQuery,
  buildEmailMessageQuery,
  cleanBody,
  compareTaskEmailRecords,
  detectTaskDirection,
  normalizeEmailHeaderText,
  normalizeLimit,
  parseExcludeActivityIds,
  soqlQuery,
  truncate,
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

  test("converts entity-encoded email addresses to bracket notation", () => {
    const body = "Please reply to &lt;support@example.com&gt; for help.";
    const result = cleanBody(body);
    expect(result).toContain("[support@example.com]");
    expect(result).not.toContain("&lt;");
    expect(result).not.toContain("&gt;");
  });

  test("strips quoted reply that begins with '> On ... wrote:' (Groove/DealHub style)", () => {
    const body =
      "From: Abccom@comcast.net\r\nTo: Bradley Boudreau <bradley.boudreau@butterflymx.com>\r\n\r\nThis is different usually I just get an invoice\r\n \r\nChristian Brewer, Owner\r\n\r\n> On 05/05/2026 7:08 PM EDT DealHub <system@dealhub.io> wrote:\r\n>  \r\n> \r\n> Some quoted body content\r\n";
    const result = cleanBody(body);
    expect(result).toContain("This is different usually I just get an invoice");
    expect(result).not.toContain("> On 05/05/2026");
    expect(result).not.toContain("Some quoted body content");
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
      "SELECT ActivityId FROM EmailMessage WHERE (RelatedToId = '500Qp0000012345AAA') AND ActivityId != null AND IsDeleted = false",
    );
    expect(soql).not.toContain("LIMIT");
    expect(soql).not.toContain("TextBody");
  });

  test("wraps compound semi-join clause to protect appended AND filters from OR precedence", () => {
    const whereClause =
      "Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z";

    expect(buildEmailMessageQuery(whereClause, 100)).toContain(
      "FROM EmailMessage WHERE (Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z) AND IsDeleted = false ORDER BY",
    );
    expect(buildEmailMessageActivityIdQuery(whereClause)).toBe(
      "SELECT ActivityId FROM EmailMessage WHERE (Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z) AND ActivityId != null AND IsDeleted = false",
    );
  });

  test("unwraps agent-supplied parentheses around EmailMessageRelation semi-joins then re-wraps the compound expression", () => {
    const whereClause =
      "(Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0')) AND MessageDate >= 2026-01-01T00:00:00Z";

    expect(buildEmailMessageQuery(whereClause, 100)).toContain(
      "FROM EmailMessage WHERE (Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId = '003Qp00000cMnCQIA0') AND MessageDate >= 2026-01-01T00:00:00Z) AND IsDeleted = false ORDER BY",
    );
  });

  test("unwraps parenthesized semi-joins with nested parentheses inside the subquery then re-wraps the compound expression", () => {
    const whereClause =
      "(Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId IN ('003Qp00000cMnCQIA0', '003Qp00000cMnCQIA1'))) AND MessageDate >= 2026-01-01T00:00:00Z";

    expect(buildEmailMessageQuery(whereClause, 100)).toContain(
      "FROM EmailMessage WHERE (Id IN (SELECT EmailMessageId FROM EmailMessageRelation WHERE RelationId IN ('003Qp00000cMnCQIA0', '003Qp00000cMnCQIA1')) AND MessageDate >= 2026-01-01T00:00:00Z) AND IsDeleted = false ORDER BY",
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
    expect(soql).toContain("IsDeleted = false");
    expect(soql).toContain("CompletedDateTime");
    expect(soql).toContain("ORDER BY ActivityDate DESC NULLS LAST, CompletedDateTime DESC NULLS LAST");
    expect(soql).not.toContain("__c");
  });

  test("uses an optional Task DateTime tie-breaker field for Groove-style same-day email chronology", async () => {
    mockGet.mockResolvedValueOnce({
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

    const taskRequestUrl = String(mockGet.mock.calls[0]?.[0]);
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

  test("rejects taskDateTimeTieBreakerField values that are not valid field API names", () => {
    return expect(
      getCleanActivityRecords({
        params: {
          objectType: "Task",
          whereClause: "WhatId = 'a3bQp000001h4J7IAI'",
          taskDateTimeTieBreakerField: "bad field name!",
        },
        authParams: {
          authToken: "token",
          baseUrl: "https://example.my.salesforce.com",
        },
      }),
    ).resolves.toMatchObject({
      success: false,
      error: "taskDateTimeTieBreakerField must be a valid Task field API name",
    });
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

describe("salesforceGetCleanActivityRecords — queryAll endpoint", () => {
  test("Task query uses /queryAll not /query", async () => {
    mockGet.mockResolvedValueOnce({ data: { records: [], done: true } });

    await getCleanActivityRecords({
      params: { objectType: "Task", whereClause: "WhatId = 'a3bQp000001h4J7IAI'" },
      authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
    });

    const requestUrl = String(mockGet.mock.calls[0]?.[0]);
    expect(requestUrl).toContain("/queryAll?");
    expect(requestUrl).not.toContain("/query?");
  });

  test("EmailMessage query uses /queryAll not /query", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { records: [], done: true } })
      .mockResolvedValueOnce({ data: { records: [], done: true } });

    await getCleanActivityRecords({
      params: { objectType: "EmailMessage", whereClause: "RelatedToId = '500Qp0000012345AAA'" },
      authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
    });

    const requestUrl = String(mockGet.mock.calls[0]?.[0]);
    expect(requestUrl).toContain("/queryAll?");
    expect(requestUrl).not.toContain("/query?");
  });
});

describe("salesforceGetCleanActivityRecords EmailMessage people resolution", () => {
  test("resolves people via EmailMessageRelation → Contact", async () => {
    // 1. Main EmailMessage query
    mockGet.mockResolvedValueOnce({
      data: {
        records: [
          {
            Id: "02sQp0000000001AAA",
            Subject: "Re: Invoice",
            MessageDate: "2026-05-01T10:00:00.000+0000",
            Incoming: true,
            IsBounced: false,
            FromAddress: "customer@example.com",
            ToAddress: "rep@butterflymx.com",
            TextBody: "Please send the updated invoice.",
            ThreadIdentifier: "thread-abc",
            MessageIdentifier: "msg-001",
            RelatedToId: "500Qp0000012345AAA",
            ActivityId: "00TQp000001abcDEF",
          },
        ],
        done: true,
      },
    });
    // 2. EmailMessageRelation query
    mockGet.mockResolvedValueOnce({
      data: {
        records: [
          { EmailMessageId: "02sQp0000000001AAA", RelationId: "003Qp00000HyTFBIA3", RelationObjectType: "Contact" },
        ],
        done: true,
      },
    });
    // 3. Contact query
    mockGet.mockResolvedValueOnce({
      data: {
        records: [{ Id: "003Qp00000HyTFBIA3", Name: "Alice Smith", Email: "customer@example.com", Title: "Manager" }],
        done: true,
      },
    });

    const result = await getCleanActivityRecords({
      params: { objectType: "EmailMessage", whereClause: "RelatedToId = '500Qp0000012345AAA'" },
      authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
    });

    expect(result).toMatchObject({
      success: true,
      threads: [
        {
          threadIdentifier: "thread-abc",
          people: [{ id: "003Qp00000HyTFBIA3", name: "Alice Smith", email: "customer@example.com", title: "Manager" }],
        },
      ],
    });
    // Verify the EmailMessageRelation query was actually issued
    const relationCall = mockGet.mock.calls[1]?.[0] as string;
    expect(decodeURIComponent(new URL(relationCall).searchParams.get("q") ?? "")).toContain("EmailMessageRelation");
  });

  test("falls back to Lead when Contact lookup returns no results", async () => {
    // 1. Main EmailMessage query
    mockGet.mockResolvedValueOnce({
      data: {
        records: [
          {
            Id: "02sQp0000000002AAA",
            Subject: "Demo request",
            MessageDate: "2026-05-02T09:00:00.000+0000",
            Incoming: true,
            IsBounced: false,
            FromAddress: "lead@prospect.com",
            ToAddress: "rep@butterflymx.com",
            TextBody: "I would like a demo.",
            ThreadIdentifier: "thread-xyz",
            MessageIdentifier: "msg-002",
            RelatedToId: null,
            ActivityId: null,
          },
        ],
        done: true,
      },
    });
    // 2. EmailMessageRelation query
    mockGet.mockResolvedValueOnce({
      data: {
        records: [
          { EmailMessageId: "02sQp0000000002AAA", RelationId: "00QQp00000HyTFBIA3", RelationObjectType: "Lead" },
        ],
        done: true,
      },
    });
    // 3. Contact query — returns nothing (it's a Lead)
    mockGet.mockResolvedValueOnce({ data: { records: [], done: true } });
    // 4. Lead fallback query
    mockGet.mockResolvedValueOnce({
      data: {
        records: [{ Id: "00QQp00000HyTFBIA3", Name: "Bob Lead", Email: "lead@prospect.com", Title: null }],
        done: true,
      },
    });

    const result = await getCleanActivityRecords({
      params: { objectType: "EmailMessage", whereClause: "RelatedToId = '500Qp0000012345AAA'" },
      authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
    });

    expect(result).toMatchObject({
      success: true,
      threads: [
        {
          people: [{ id: "00QQp00000HyTFBIA3", name: "Bob Lead", email: "lead@prospect.com", title: null }],
        },
      ],
    });
  });
});

describe("salesforceGetCleanActivityRecords EmailMessage bounced semantics", () => {
  test("thread is bounced when any message in the thread bounced, not just the latest", async () => {
    // Main EmailMessage query — two messages in same thread; older one bounced, latest did not
    mockGet.mockResolvedValueOnce({
      data: {
        records: [
          {
            Id: "02sQp0000000002AAA",
            Subject: "Delivery notification",
            MessageDate: "2026-05-02T12:00:00.000+0000",
            Incoming: false,
            IsBounced: false,
            FromAddress: "rep@butterflymx.com",
            ToAddress: "customer@example.com",
            TextBody: "Retry send.",
            ThreadIdentifier: "thread-bounce",
            MessageIdentifier: "msg-002",
            RelatedToId: null,
            ActivityId: null,
          },
          {
            Id: "02sQp0000000001AAA",
            Subject: "Delivery notification",
            MessageDate: "2026-05-01T10:00:00.000+0000",
            Incoming: false,
            IsBounced: true,
            FromAddress: "rep@butterflymx.com",
            ToAddress: "customer@example.com",
            TextBody: "Original send.",
            ThreadIdentifier: "thread-bounce",
            MessageIdentifier: "msg-001",
            RelatedToId: null,
            ActivityId: null,
          },
        ],
        done: true,
      },
    });
    // EmailMessageRelation — no relations for these messages
    mockGet.mockResolvedValueOnce({ data: { records: [], done: true } });

    const result = await getCleanActivityRecords({
      params: { objectType: "EmailMessage", whereClause: "RelatedToId = '500Qp0000012345AAA'" },
      authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
    });

    expect(result).toMatchObject({
      success: true,
      threads: [{ threadIdentifier: "thread-bounce", bounced: true }],
    });
  });
});

describe("salesforceGetCleanActivityRecords normalizeEmailHeaderText", () => {
  test("detects Task direction from HTML-encoded From header", () => {
    const normalized = normalizeEmailHeaderText("<div>From: John Doe &lt;john@example.com&gt;</div>");
    expect(detectTaskDirection("Email: Follow-up", normalized, "rep@example.com")).toBe("inbound");
    expect(detectTaskDirection("Email: Follow-up", normalized, "john@example.com")).toBe("outbound");
  });

  test("strips HTML tags and decodes entities leaving plain text", () => {
    const result = normalizeEmailHeaderText("<p>Hello &amp; goodbye</p><br/>Next line");
    expect(result).not.toContain("<");
    expect(result).toContain("Hello & goodbye");
    expect(result).toContain("Next line");
  });

  test("returns null for null or empty input", () => {
    expect(normalizeEmailHeaderText(null)).toBeNull();
    expect(normalizeEmailHeaderText("")).toBeNull();
    expect(normalizeEmailHeaderText("   ")).toBeNull();
  });
});

describe("salesforceGetCleanActivityRecords containsSemiJoinSubquery string-literal safety", () => {
  test("wraps clause in parens when IN (SELECT appears only inside a quoted literal", () => {
    // The literal '%IN (SELECT phase%' must not be confused with a real semi-join subquery.
    // Without this fix, the clause would skip the (…) wrapper, breaking OR operator precedence.
    const whereClause = "Subject LIKE '%IN (SELECT phase%' OR WhatId = '500Qp0000012345AAA'";
    expect(buildEmailMessageQuery(whereClause, 20)).toContain(`WHERE (${whereClause})`);
    expect(buildEmailMessageActivityIdQuery(whereClause)).toContain(`WHERE (${whereClause})`);
  });

  test("emits a bare lone semi-join without outer parens (Salesforce rejects the wrapped form)", () => {
    const whereClause = "WhoId IN (SELECT ContactId FROM CampaignMember WHERE CampaignId = '001Qp000000abcDEF')";
    const query = buildEmailMessageQuery(whereClause, 20);
    expect(query).toContain(`WHERE ${whereClause}`);
    expect(query).not.toContain(`WHERE (${whereClause})`);
  });

  test("wraps semi-join combined with OR so appended AND filters apply to the whole expression", () => {
    // Without this fix: "WhoId IN (SELECT ...) OR WhatId = '...' AND IsDeleted = false"
    // AND binds tighter, so IsDeleted = false only guards the WhatId branch.
    // With fix: "(WhoId IN (SELECT ...) OR WhatId = '...') AND IsDeleted = false"
    const whereClause =
      "WhoId IN (SELECT ContactId FROM CampaignMember WHERE CampaignId = '001Qp000000abcDEF') OR WhatId = '001Qp000000xyzAAA'";
    const query = buildEmailMessageQuery(whereClause, 20);
    expect(query).toContain(`WHERE (${whereClause})`);
    expect(query).not.toContain(`WHERE ${whereClause} AND`);
  });
});

describe("salesforceGetCleanActivityRecords excludeActivityIds size limit", () => {
  test("rejects excludeActivityIds lists that exceed MAX_EXCLUDE_IDS", () => {
    const ids = Array.from({ length: 501 }, (_, i) => `00T${String(i).padStart(15, "0")}`);
    expect(() => parseExcludeActivityIds(JSON.stringify(ids))).toThrow(/exceeds the limit of \d+/);
  });

  test("accepts excludeActivityIds lists at exactly the limit", () => {
    const ids = Array.from({ length: 500 }, (_, i) => `00T${String(i).padStart(15, "0")}`);
    expect(() => parseExcludeActivityIds(JSON.stringify(ids))).not.toThrow();
  });
});

describe("salesforceGetCleanActivityRecords returnActivityIds guard", () => {
  test("rejects returnActivityIds when objectType is Task", () => {
    return expect(
      getCleanActivityRecords({
        params: {
          objectType: "Task",
          whereClause: "WhatId = 'a3bQp000001h4J7IAI'",
          returnActivityIds: true,
        },
        authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
      }),
    ).resolves.toMatchObject({
      success: false,
      error: "returnActivityIds is only supported when objectType is EmailMessage",
    });
  });
});

describe("salesforceGetCleanActivityRecords empty excludeActivityIds on EmailMessage", () => {
  test("allows an empty excludeActivityIds array on EmailMessage without error", async () => {
    mockGet
      .mockResolvedValueOnce({ data: { records: [], done: true } })
      .mockResolvedValueOnce({ data: { records: [], done: true } });

    await expect(
      getCleanActivityRecords({
        params: {
          objectType: "EmailMessage",
          whereClause: "RelatedToId = '500Qp0000012345AAA'",
          excludeActivityIds: "[]",
        },
        authParams: { authToken: "token", baseUrl: "https://example.my.salesforce.com" },
      }),
    ).resolves.toMatchObject({ success: true });
  });
});

describe("salesforceGetCleanActivityRecords truncate", () => {
  test("returns text unchanged when at or below the limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hello", 5)).toBe("hello");
  });

  test("truncates to exactly maxLength characters including the ellipsis", () => {
    const result = truncate("hello world", 8);
    expect(result).toHaveLength(8);
    expect(result).toBe("hello w…");
  });

  test("returns null for falsy input", () => {
    expect(truncate(null, 10)).toBeNull();
    expect(truncate("", 10)).toBeNull();
  });

  test("returns null when maxLength is zero", () => {
    expect(truncate("hello", 0)).toBeNull();
  });
});
