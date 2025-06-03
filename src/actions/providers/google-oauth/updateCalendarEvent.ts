import { axiosClient } from "../../util/axiosClient";
import type { AxiosResponse } from "axios";
import type {
  AuthParamsType,
  googleOauthUpdateCalendarEventFunction,
  googleOauthUpdateCalendarEventOutputType,
  googleOauthUpdateCalendarEventParamsType,
} from "../../autogen/types";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const updateCalendarEvent: googleOauthUpdateCalendarEventFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthUpdateCalendarEventParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthUpdateCalendarEventOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, eventId: "", eventUrl: "" };
  }

  const { calendarId, eventId, updates } = params;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  const body: Record<string, unknown> = {};
  if (updates) {
    if (updates.title != undefined) body.summary = updates.title;
    if (updates.description != undefined) body.description = updates.description;
    if (updates.start != undefined) body.start = { dateTime: updates.start };
    if (updates.end != undefined) body.end = { dateTime: updates.end };
    if (updates.location != undefined) body.location = updates.location;
    if (updates.attendees != undefined) body.attendees = updates.attendees.map(email => ({ email }));
    if (updates.status != undefined) body.status = updates.status;
    if (updates.organizer != undefined) body.organizer = updates.organizer;
  }

  try {
    const res: AxiosResponse = await axiosClient.patch(url, body, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const { id, htmlLink } = res.data;
    return {
      success: true,
      eventId: id,
      eventUrl: htmlLink,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating event",
    };
  }
};

export default updateCalendarEvent;
