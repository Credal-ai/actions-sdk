import axios from "axios";
import type {
  AuthParamsType,
  gongGetGongTranscriptsFunction,
  gongGetGongTranscriptsParamsType,
  gongGetGongTranscriptsOutputType,
} from "../../autogen/types";

async function getAllPaginatedResults<T>(
  username: string,
  password: string,
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T[]> {
  let results: T[] = [];
  let cursor: string | undefined = undefined;

  do {
    const encodedAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const response: { data?: any } = await axios.get(
      `https://api.gong.io/v2/${endpoint}` + (cursor ? `?cursor=${cursor}` : ""),
      {
        headers: {
          Authorization: `Basic ${encodedAuth}`,
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
    if (endpoint == "settings/trackers") {
      results = [...results, ...response.data.trackers];
    } else if (endpoint == "users") {
      results = [...results, ...response.data.users];
    }
    cursor = response.data?.cursor;
  } while (cursor);

  return results;
}

async function postAllPaginatedResults<T>(
  username: string,
  password: string,
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T[]> {
  let results: T[] = [];
  let cursor: string | undefined = undefined;

  do {
    const encodedAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const response: { data?: any } = await axios.post(
      `https://api.gong.io/v2/${endpoint}/calls` + (cursor ? `?cursor=${cursor}` : ""),
      {
        filter: {
          ...params,
        },
      },
      {
        headers: {
          Authorization: `Basic ${encodedAuth}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!response) {
      return results;
    }
    if (endpoint === "transcript") {
      results = [...results, ...response.data.callTranscripts];
    } else if (endpoint === "extensive") {
      results = [...results, ...response.data.calls];
    }
    cursor = response.data?.cursor;
  } while (cursor);

  return results;
}

async function getTrackersByName(username: string, password: string, trackerNames: string[]) {
  const trackers = await getAllPaginatedResults<any>(username, password, "settings/trackers");
  return trackers.filter(tracker => trackerNames.includes(tracker.name)).map(tracker => tracker.id);
}

async function getGongUsersByRole(
  username: string,
  password: string,
  role: string,
): Promise<{ id: string; name: string }[]> {
  const users = await getAllPaginatedResults<any>(username, password, "users");
  return users.filter(user => user.title === role).map(user => ({ id: user.id, name: user.name }));
}

async function getFilteredCallsForUsers(
  username: string,
  password: string,
  userIds: string[],
  trackerIds: string[],
  startDate: string,
  endDate: string,
) {
  const calls = await postAllPaginatedResults<any>(username, password, "extensive", {
    fromDateTime: startDate,
    toDateTime: endDate,
    primaryUserIds: userIds.length > 0 ? userIds : null,
    trackerIds,
  });
  return calls.map(call => call.id);
}

async function getTranscriptsForCalls(
  username: string,
  password: string,
  callIds: string[],
  startDate: string,
  endDate: string,
) {
  const transcripts = await postAllPaginatedResults<any>(username, password, "transcript", {
    fromDateTime: startDate,
    toDateTime: endDate,
    callIds,
  });
  return transcripts;
}

// Retrieves transcripts from Gong based on the provided parameters
const getGongTranscripts: gongGetGongTranscriptsFunction = async ({
  params,
  authParams,
}: {
  params: gongGetGongTranscriptsParamsType;
  authParams: AuthParamsType;
}): Promise<gongGetGongTranscriptsOutputType> => {
  if (!authParams.username || !authParams.password) {
    return {
      success: false,
      error: "No username or password provided",
    };
  }

  try {
    const gongUsers = await getGongUsersByRole(authParams.username, authParams.password, params.userRole ?? "");
    const trackerIds = await getTrackersByName(authParams.username, authParams.password, params.trackers ?? []);
    // Get calls owned by the users and filtered by the trackers
    const calls = await getFilteredCallsForUsers(
      authParams.username,
      authParams.password,
      gongUsers.map(user => user.id),
      trackerIds,
      params.startDate ?? "",
      params.endDate ?? "",
    );
    // Get transcripts for the calls we found
    const callTranscripts = await getTranscriptsForCalls(
      authParams.username,
      authParams.password,
      calls,
      params.startDate ?? "",
      params.endDate ?? "",
    );
    // Map speaker IDs to names in the transcripts
    const userIdToNameMap = Object.fromEntries(gongUsers.map(user => [user.id, user.name]));
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
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.errors ?? error.message,
    };
  }
};

export default getGongTranscripts;
