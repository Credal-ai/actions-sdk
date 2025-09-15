import z from "zod";

export const SearchSlackOutputContent = z.object({
    channelId: z.string().describe("Slack channel/conversation ID (C…/G…/D… or name)."),
    ts: z.string().describe("Slack message timestamp of the hit (or thread root when hydrated as thread)."),
    text: z.string().describe("Message text of the anchor (hit or thread root).").optional(),
    userEmail: z.string().describe("User email of the anchor message’s author (if available).").optional(),
    userName: z.string().describe("User name of the anchor message’s author (if available).").optional(),
    permalink: z
        .string()
        .describe("A Slack permalink to the anchor (message or thread root), if resolvable.")
        .optional(),
    context: z
        .array(
            z.object({
                ts: z.string().describe("Timestamp of the contextual message."),
                text: z.string().describe("Text of the contextual message.").optional(),
                userEmail: z.string().describe("Author user email of the contextual message.").optional(),
                userName: z.string().describe("Author user name of the contextual message.").optional(),
            }),
        )
        .describe(
            "When a hit is in a thread, this is the full thread (root first). Otherwise, a small surrounding context window (~3 before, 5 after).",
        )
        .optional(),
});

export type SearchSlackOutputContent = z.infer<typeof SearchSlackOutputContent>;