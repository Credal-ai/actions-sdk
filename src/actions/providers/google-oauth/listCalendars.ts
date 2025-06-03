import { axiosClient } from "../../util/axiosClient";
import type { AxiosResponse } from "axios";
import type {
  AuthParamsType,
  googleOauthListCalendarsFunction,
  googleOauthListCalendarsOutputType,
  googleOauthListCalendarsParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const listCalendars: googleOauthListCalendarsFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthListCalendarsParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthListCalendarsOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, calendars: [] };
  }

  const url = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
  const allCalendars = [];
  let pageToken: string | undefined = undefined;
  let fetchedCount = 0;
  const max = params.maxResults ?? 250; // Default to 250 if not specified, Google API max is 250

  try {
    while (fetchedCount < max) {
      const res: AxiosResponse = await axiosClient.get(url, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        params: {
          showDeleted: false,
          showHidden: false,
          pageToken,
          maxResults: Math.min(250, max - fetchedCount), // Google API max is 250
        },
      });
      const { items = [], nextPageToken = undefined } = res.data;
      if (!Array.isArray(items) || items.length <= 0) break;

      const batch = items.slice(0, max - fetchedCount);
      allCalendars.push(
        ...batch.map(c => ({
          id: c.id,
          summary: c.summary,
        })),
      );

      fetchedCount = allCalendars.length;
      if (!nextPageToken || fetchedCount >= max) break;
      pageToken = nextPageToken;
    }
    return {
      success: true,
      calendars: allCalendars,
    };
  } catch (error) {
    return {
      success: false,
      calendars: [],
      error: error instanceof Error ? error.message : "Unknown error listing calendars",
    };
  }
};

export default listCalendars;
