import { axiosClient } from "../../util/axiosClient";
import type {
  AuthParamsType,
  googleOauthDeleteCalendarEventFunction,
  googleOauthDeleteCalendarEventOutputType,
  googleOauthDeleteCalendarEventParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const deleteCalendarEvent: googleOauthDeleteCalendarEventFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthDeleteCalendarEventParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthDeleteCalendarEventOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { calendarId, eventId } = params;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  try {
    await axiosClient.delete(url, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error deleting event",
    };
  }
};

export default deleteCalendarEvent;
