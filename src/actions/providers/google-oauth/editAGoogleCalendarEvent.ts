import { axiosClient } from "../../util/axiosClient.js";
import type { AxiosResponse } from "axios";
import type {
  AuthParamsType,
  googleOauthEditAGoogleCalendarEventFunction,
  googleOauthEditAGoogleCalendarEventOutputType,
  googleOauthEditAGoogleCalendarEventParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getDayOfWeek } from "../../../utils/datetime.js";

const editAGoogleCalendarEvent: googleOauthEditAGoogleCalendarEventFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthEditAGoogleCalendarEventParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthEditAGoogleCalendarEventOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, eventId: "", eventUrl: "", eventDayOfWeek: "" };
  }

  const { calendarId, eventId, title, description, start, end, location, attendees, status, organizer, timeZone } =
    params;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  const body: Record<string, unknown> = {};
  if (title !== undefined) body.summary = title;
  if (description !== undefined) body.description = description;
  if (start !== undefined) {
    body.start = { dateTime: start };
    if (timeZone) {
      (body.start as Record<string, unknown>).timeZone = timeZone;
    }
  }
  if (end !== undefined) {
    body.end = { dateTime: end };
    if (timeZone) {
      (body.end as Record<string, unknown>).timeZone = timeZone;
    }
  }
  if (location !== undefined) body.location = location;
  if (attendees !== undefined) body.attendees = attendees.map(email => ({ email }));
  if (status !== undefined) body.status = status;
  if (organizer !== undefined) body.organizer = organizer;

  try {
    const res: AxiosResponse = await axiosClient.patch(url, body, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const { id, htmlLink } = res.data;
    // Get the event day of week from the start time (use provided start or fetch from response)
    const eventDayOfWeek = start
      ? getDayOfWeek(start)
      : getDayOfWeek(res.data.start?.dateTime || res.data.start?.date || "");
    return {
      success: true,
      eventId: id,
      eventUrl: htmlLink,
      eventDayOfWeek,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error editing event",
      eventId: "",
      eventUrl: "",
      eventDayOfWeek: "",
    };
  }
};

export default editAGoogleCalendarEvent;
