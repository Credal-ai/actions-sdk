import { z } from "zod";
import axios, { AxiosError } from "axios";
import { AuthParamsType } from "../../autogen/types";

export const UserSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    title: z.string(),
    emailAddress: z.string(),
  })
  .partial()
  .passthrough();

export const CallSchema = z
  .object({
    metaData: z.object({
      id: z.string(),
      primaryUserId: z.string(),
      started: z.string(),
      isPrivate: z.boolean(),
      title: z.string(),
    }),
    parties: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          userId: z.string(),
          speakerId: z.string().nullable(),
        })
        .partial()
        .passthrough(),
    ),
    content: z.object({
      trackers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        }),
      ),
    }),
  })
  .partial()
  .passthrough();

export const SentenceSchema = z
  .object({
    start: z.number(),
    end: z.number(),
    text: z.string(),
  })
  .partial()
  .passthrough();

export const TranscriptSchema = z
  .object({
    callId: z.string(),
    transcript: z.array(
      z
        .object({
          speakerId: z.string(),
          topic: z.string().nullable(),
          sentences: z.array(SentenceSchema),
        })
        .partial()
        .passthrough(),
    ),
  })
  .partial()
  .passthrough();

type User = z.infer<typeof UserSchema>;
type Call = z.infer<typeof CallSchema>;
type Transcript = z.infer<typeof TranscriptSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GongResponseSchema = z.object({
  users: z.array(UserSchema).optional(),
  calls: z.array(CallSchema).optional(),
  callTranscripts: z.array(TranscriptSchema).optional(),
  cursor: z.string().optional(),
});

type GongResponse = z.infer<typeof GongResponseSchema>;

async function getCalls(
  authToken: string,
  params: Record<string, string[] | string | undefined> = {},
): Promise<Call[]> {
  let results: Call[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: { data: GongResponse } = await axios.post<GongResponse>(
      `https://api.gong.io/v2/calls/extensive` + (cursor ? `?cursor=${cursor}` : ""),
      {
        filter: {
          ...params,
        },
        contentSelector: {
          exposedFields: {
            parties: true,
            content: {
              trackers: true,
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!response) {
      return results;
    }
    const parsedItems = z.array(CallSchema).safeParse(response.data.calls);
    if (parsedItems.success) {
      results = [...results, ...parsedItems.data];
    } else {
      return results;
    }
    cursor = response.data.cursor;
  } while (cursor);

  return results;
}

async function getTranscripts(
  authToken: string,
  params: Record<string, string | string[] | number | null> = {},
): Promise<Transcript[]> {
  let results: Transcript[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: { data: GongResponse } = await axios.post<GongResponse>(
      `https://api.gong.io/v2/calls/transcript` + (cursor ? `?cursor=${cursor}` : ""),
      {
        filter: {
          ...params,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!response) {
      return results;
    }
    const parsedItems = z.array(TranscriptSchema).safeParse(response.data.callTranscripts);
    if (parsedItems.success) {
      results = [...results, ...parsedItems.data];
    } else {
      return results;
    }
    cursor = response.data.cursor;
  } while (cursor);

  return results;
}

export async function getGongTranscripsFromPrimaryUserIds(primaryUserIds: string[],
    authToken: string,
    startDate: string | undefined,
    endDate: string | undefined,
    trackerInput: string[] | undefined,
) {
  const calls = await getCalls(authToken, {
    fromDateTime: startDate ?? "",
    toDateTime: endDate ?? "",
    primaryUserIds: primaryUserIds,
  });
  const callsWithTrackers = calls.filter(call => {
    // If the user didn't provide any trackers to filter on, return all calls
    if (!trackerInput || trackerInput.length === 0) {
      return true;
    }
    // Filter out calls that don't have trackers if the user specified trackers
    if (!call.content || !call.content.trackers) {
      return false;
    }
    const trackerNames = call.content.trackers.map(tracker => tracker.name);
    // Check if any of the trackers in the call match the ones provided by the user
    return trackerInput.some(tr => trackerNames.includes(tr));
  });
  const publicCalls = callsWithTrackers.filter(call => {
    if (!call.metaData) {
      return false;
    }
    return !call.metaData.isPrivate;
  });
  if (publicCalls.length === 0) {
    return {
      success: true,
      callTranscripts: [],
    };
  }
  // Get transcripts for the calls we found
  const callTranscripts = await getTranscripts(authToken, {
    fromDateTime: startDate ?? "",
    toDateTime: endDate ?? "",
    callIds: publicCalls.map(call => call.metaData?.id).filter((id): id is string => id !== undefined),
  });
  // Map speaker IDs to names in the transcripts
  const userIdToNameMap: Record<string, string> = {};
  publicCalls.forEach(call => {
    // Check if call has parties array
    if (call.parties && Array.isArray(call.parties)) {
      // Iterate through each party in the call
      call.parties.forEach(party => {
        // Add the mapping of speakerId to name
        if (party.speakerId && party.name) {
          userIdToNameMap[party.speakerId] = party.name;
        }
      });
    }
  });
  const callTranscriptsWithNames = callTranscripts.map(callTranscript => {
    const currTranscript = { ...callTranscript };
    currTranscript.transcript = callTranscript.transcript?.map(transcript => {
      const { speakerId, ...rest } = transcript;
      return {
        ...rest,
        speakerName: userIdToNameMap[speakerId ?? ""] ?? "Unknown",
      };
    });
    return {
      callName: publicCalls.find(call => call.metaData?.id === callTranscript.callId)?.metaData?.title ?? "",
      startTime: publicCalls.find(call => call.metaData?.id === callTranscript.callId)?.metaData?.started ?? "",
      ...currTranscript,
    };
  });
  return callTranscriptsWithNames;
}
