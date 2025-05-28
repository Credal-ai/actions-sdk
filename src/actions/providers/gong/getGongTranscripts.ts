import axios, { AxiosError } from "axios";
import { z } from "zod";
import type {
  AuthParamsType,
  gongGetGongTranscriptsFunction,
  gongGetGongTranscriptsParamsType,
  gongGetGongTranscriptsOutputType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const UserSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    title: z.string(),
    emailAddress: z.string(),
  })
  .partial()
  .passthrough();

const CallSchema = z
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
          emailAddress: z.string(),
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

const SentenceSchema = z
  .object({
    start: z.number(),
    end: z.number(),
    text: z.string(),
  })
  .partial()
  .passthrough();

const TranscriptSchema = z
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

async function getUsers(authToken: string): Promise<User[]> {
  let results: User[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response: { data: GongResponse } = await axios.get<GongResponse>(
      `https://api.gong.io/v2/users` + (cursor ? `?cursor=${cursor}` : ""),
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
      error: MISSING_AUTH_TOKEN,
    };
  }
  if (!authParams.username) {
    return {
      success: false,
      error: "Missing user email",
    };
  }
  try {
    const gongUsers = await getUsers(authParams.authToken);
    const userEmails = gongUsers.map(user => user.emailAddress);
    if (!userEmails.includes(authParams.username)) {
      return {
        success: false,
        error: "User email not found in Gong users",
      };
    }
    const filteredGongUsers = gongUsers.filter(user => user.title === params.userRole);
    const filteredPrimaryIds = filteredGongUsers.map(user => user.id).filter((id): id is string => id !== undefined);
    if (filteredPrimaryIds.length === 0) {
      return {
        success: false,
        error: "No Gong users found with the specified role",
      };
    }
    const calls = await getCalls(authParams.authToken, {
      fromDateTime: params.startDate ?? "",
      toDateTime: params.endDate ?? "",
      primaryUserIds: filteredPrimaryIds,
    });
    const callsWithTrackers = calls.filter(call => {
      // If the user didn't provide any trackers to filter on, return all calls
      if (!params.trackers || params.trackers.length === 0) {
        return true;
      }
      // Filter out calls that don't have trackers if the user specified trackers
      if (!call.content || !call.content.trackers) {
        return false;
      }
      const trackerNames = call.content.trackers.map(tracker => tracker.name);
      // Check if any of the trackers in the call match the ones provided by the user
      return params.trackers.some(tr => trackerNames.includes(tr));
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
    const callTranscripts = await getTranscripts(authParams.authToken, {
      fromDateTime: params.startDate ?? "",
      toDateTime: params.endDate ?? "",
      callIds: publicCalls.map(call => call.metaData?.id).filter((id): id is string => id !== undefined),
    });
    // Map speaker IDs to names in the transcripts
    const userIdToNameMap: Record<string, string> = {};
    const userIdToEmailMap: Record<string, string> = {};
    publicCalls.forEach(call => {
      // Check if call has parties array
      if (call.parties && Array.isArray(call.parties)) {
        // Iterate through each party in the call
        call.parties.forEach(party => {
          // Add the mapping of speakerId to name
          if (party.speakerId) {
            if (party.name) {
              userIdToNameMap[party.speakerId] = party.name;
            }
            if (party.emailAddress) {
              userIdToEmailMap[party.speakerId] = party.emailAddress;
            }
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
          speakerEmail: userIdToEmailMap[speakerId ?? ""] ?? "Unknown",
        };
      });
      return {
        callName: publicCalls.find(call => call.metaData?.id === callTranscript.callId)?.metaData?.title ?? "",
        startTime: publicCalls.find(call => call.metaData?.id === callTranscript.callId)?.metaData?.started ?? "",
        ...currTranscript,
      };
    });
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
