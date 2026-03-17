import { describe, expect, it } from "@jest/globals";
import { convertMentionsInAdf } from "../../src/actions/providers/jira/convertMentionsInAdf";

describe("convertMentionsInAdf", () => {
  it("returns non-object input unchanged", () => {
    expect(convertMentionsInAdf(null)).toBeNull();
    expect(convertMentionsInAdf(undefined)).toBeUndefined();
    expect(convertMentionsInAdf("hello")).toBe("hello");
  });

  it("returns ADF with no mentions unchanged", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    };
    expect(convertMentionsInAdf(adf)).toEqual(adf);
  });

  it("converts a single mention in a text node", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Tagging [~accountid:712020:40f20a8b-4aba-4b8c-881f-b94e5ef918a6] as requested.",
            },
          ],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const paragraph = (result.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(3);
    expect(inlineNodes[0]).toEqual({ type: "text", text: "Tagging " });
    expect(inlineNodes[1]).toEqual({
      type: "mention",
      attrs: {
        id: "712020:40f20a8b-4aba-4b8c-881f-b94e5ef918a6",
        text: "@mentioned-user",
        accessLevel: "",
      },
    });
    expect(inlineNodes[2]).toEqual({ type: "text", text: " as requested." });
  });

  it("converts multiple mentions in a single text node", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "cc [~accountid:aaa-111] and [~accountid:bbb-222] for review",
            },
          ],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const paragraph = (result.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(5);
    expect(inlineNodes[0]).toEqual({ type: "text", text: "cc " });
    expect(inlineNodes[1]).toEqual({
      type: "mention",
      attrs: { id: "aaa-111", text: "@mentioned-user", accessLevel: "" },
    });
    expect(inlineNodes[2]).toEqual({ type: "text", text: " and " });
    expect(inlineNodes[3]).toEqual({
      type: "mention",
      attrs: { id: "bbb-222", text: "@mentioned-user", accessLevel: "" },
    });
    expect(inlineNodes[4]).toEqual({ type: "text", text: " for review" });
  });

  it("handles mention at the start of text", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "[~accountid:abc-123] please review" }],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const paragraph = (result.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(2);
    expect(inlineNodes[0]).toEqual({
      type: "mention",
      attrs: { id: "abc-123", text: "@mentioned-user", accessLevel: "" },
    });
    expect(inlineNodes[1]).toEqual({ type: "text", text: " please review" });
  });

  it("handles mention at the end of text", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "assigned to [~accountid:abc-123]" }],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const paragraph = (result.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(2);
    expect(inlineNodes[0]).toEqual({ type: "text", text: "assigned to " });
    expect(inlineNodes[1]).toEqual({
      type: "mention",
      attrs: { id: "abc-123", text: "@mentioned-user", accessLevel: "" },
    });
  });

  it("handles text node that is only a mention", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "[~accountid:abc-123]" }],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const paragraph = (result.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(1);
    expect(inlineNodes[0]).toEqual({
      type: "mention",
      attrs: { id: "abc-123", text: "@mentioned-user", accessLevel: "" },
    });
  });

  it("preserves marks on surrounding text but not on mention nodes", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Hello [~accountid:abc-123] world",
              marks: [{ type: "strong" }],
            },
          ],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const paragraph = (result.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(3);
    expect(inlineNodes[0]).toEqual({
      type: "text",
      text: "Hello ",
      marks: [{ type: "strong" }],
    });
    expect(inlineNodes[1]).toEqual({
      type: "mention",
      attrs: { id: "abc-123", text: "@mentioned-user", accessLevel: "" },
    });
    expect(inlineNodes[2]).toEqual({
      type: "text",
      text: " world",
      marks: [{ type: "strong" }],
    });
  });

  it("leaves non-text nodes untouched", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "before " },
            { type: "hardBreak" },
            { type: "text", text: " after" },
          ],
        },
      ],
    };
    expect(convertMentionsInAdf(adf)).toEqual(adf);
  });

  it("recurses into nested block nodes (e.g. blockquote)", () => {
    const adf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "FYI [~accountid:nested-id] check this" },
              ],
            },
          ],
        },
      ],
    };

    const result = convertMentionsInAdf(adf) as Record<string, unknown>;
    const blockquote = (result.content as Array<Record<string, unknown>>)[0];
    const paragraph = (blockquote.content as Array<Record<string, unknown>>)[0];
    const inlineNodes = paragraph.content as Array<Record<string, unknown>>;

    expect(inlineNodes).toHaveLength(3);
    expect(inlineNodes[0]).toEqual({ type: "text", text: "FYI " });
    expect(inlineNodes[1]).toEqual({
      type: "mention",
      attrs: { id: "nested-id", text: "@mentioned-user", accessLevel: "" },
    });
    expect(inlineNodes[2]).toEqual({ type: "text", text: " check this" });
  });
});
