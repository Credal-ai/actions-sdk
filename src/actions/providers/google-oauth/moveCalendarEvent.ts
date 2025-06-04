import { axiosClient } from "../../util/axiosClient";
import type { AxiosResponse } from "axios";
import type {
  AuthParamsType,
  googleOauthMoveCalendarEventFunction,
  googleOauthMoveCalendarEventOutputType,
  googleOauthMoveCalendarEventParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const moveCalendarEvent: googleOauthMoveCalendarEventFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthMoveCalendarEventParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthMoveCalendarEventOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }

  const { calendarId, eventId, destination } = params;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}/move`;

  try {
    const res: AxiosResponse = await axiosClient.post(
      url,
      {},
      {
        params: { destination },
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
      },
    );

    return {
      success: true,
      eventId: res.data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error moving event",
    };
  }
};

export default moveCalendarEvent;
