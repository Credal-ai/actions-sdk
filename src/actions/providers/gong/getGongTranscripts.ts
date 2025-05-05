import axios, { AxiosError } from "axios";
import { z } from "zod";
import type {
  AuthParamsType,
  gongGetGongTranscriptsFunction,
  gongGetGongTranscriptsParamsType,
  gongGetGongTranscriptsOutputType,
} from "../../autogen/types";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
});

const TrackerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const CallSchema = z.object({
  id: z.string(),
  primaryUserId: z.string().optional(),
  started: z.string().optional(),
});

const SentenceSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

const TranscriptSchema = z.object({
  callId: z.string(),
  transcript: z.array(
    z.object({
      speakerId: z.string(),
      topic: z.string(),
      sentences: z.array(SentenceSchema),
    }),
  ),
});

type User = z.infer<typeof UserSchema>;
type Tracker = z.infer<typeof TrackerSchema>;
type Call = z.infer<typeof CallSchema>;
type Transcript = z.infer<typeof TranscriptSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GongResponseSchema = z.object({
  users: z.array(UserSchema).optional(),
  trackers: z.array(TrackerSchema).optional(),
  calls: z.array(CallSchema).optional(),
  callTranscripts: z.array(TranscriptSchema).optional(),
  cursor: z.string().optional(),
});

type GongResponse = z.infer<typeof GongResponseSchema>;

async function getUsers(authToken: string, params: Record<string, number | string> = {}): Promise<User[]> {
  let results: User[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: { data: GongResponse } = await axios.post<GongResponse>(
      `https://api.gong.io/v2/users/extensive` + (cursor ? `?cursor=${cursor}` : ""),
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
    const parsedItems = z.array(UserSchema).safeParse(response.data.users);
    if (parsedItems.success) {
      results = [...results, ...parsedItems.data];
    } else {
      return results;
    }
    cursor = response.data.cursor;
  } while (cursor);

  return results;
}

async function getTrackers(authToken: string, params: Record<string, number | string> = {}): Promise<Tracker[]> {
  let results: Tracker[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: { data: GongResponse } = await axios.get<GongResponse>(
      `https://api.gong.io/v2/settings/trackers` + (cursor ? `?cursor=${cursor}` : ""),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        params: {
          filter: {
            ...params,
          },
        },
      },
    );
    if (!response) {
      return results;
    }
    const parsedItems = z.array(TrackerSchema).safeParse(response.data.trackers);
    if (parsedItems.success) {
      results = [...results, ...parsedItems.data];
    } else {
      return results;
    }
    cursor = response.data.cursor;
  } while (cursor);

  return results;
}

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
  params: Record<string, string | string[] | number> = {},
): Promise<Transcript[]> {
  let results: Transcript[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: { data: GongResponse } = await axios.post<GongResponse>(
      `https://api.gong.io/v2/transcript/calls/transcripts` + (cursor ? `?cursor=${cursor}` : ""),
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

// Retrieves transcripts from Gong based on the provided parameters
const getGongTranscripts: gongGetGongTranscriptsFunction = async ({
  params,
  authParams,
}: {
  params: gongGetGongTranscriptsParamsType;
  authParams: AuthParamsType;
}): Promise<gongGetGongTranscriptsOutputType> => {
  if (!authParams.authToken) {
    return {
      success: false,
      error: "No auth token provided",
    };
  }
  try {
    const gongUsers = await getUsers(authParams.authToken, { userRole: params.userRole });
    const filteredGongUsers = gongUsers.filter(user => user.title === params.userRole);
    const trackers = await getTrackers(authParams.authToken, {});
    const filteredTrackers = trackers.filter(tracker => (params.trackers ?? []).includes(tracker.name));
    // Get calls owned by the users and filtered by the trackers
    const calls = await getCalls(authParams.authToken, {
      fromDateTime: params.startDate ?? "",
      toDateTime: params.endDate ?? "",
      primaryUserIds: filteredGongUsers.length > 0 ? filteredGongUsers.map(user => user.id) : undefined,
      trackerIds: filteredTrackers.length > 0 ? filteredTrackers.map(tracker => tracker.id) : undefined,
    });
    // Get transcripts for the calls we found
    const callTranscripts = await getTranscripts(authParams.authToken, {
      fromDateTime: params.startDate ?? "",
      toDateTime: params.endDate ?? "",
      callIds: calls.map(call => call.id),
    });
    // Map speaker IDs to names in the transcripts
    const userIdToNameMap = Object.fromEntries(filteredGongUsers.map(user => [user.id, user.name]));
    const callTranscriptsWithNames = callTranscripts.map(callTranscript => ({
      ...callTranscript,
      transcript: callTranscript.transcript.map((transcript: { speakerId: string }) => ({
        ...transcript,
        speakerName: userIdToNameMap[transcript.speakerId] || transcript.speakerId,
      })),
    }));
    return {
      success: true,
      callTranscripts: callTranscriptsWithNames,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof AxiosError ? (error.response?.data?.errors ?? error.message) : error,
    };
  }
};

export default getGongTranscripts;
