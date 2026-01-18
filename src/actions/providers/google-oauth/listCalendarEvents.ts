import { axiosClient } from "../../util/axiosClient.js";
import type { AxiosResponse } from "axios";
import type {
  AuthParamsType,
  googleOauthListCalendarEventsFunction,
  googleOauthListCalendarEventsOutputType,
  googleOauthListCalendarEventsParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import { getDayOfWeek } from "../../../utils/datetime.js";

const listCalendarEvents: googleOauthListCalendarEventsFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthListCalendarEventsParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthListCalendarEventsOutputType> => {
  if (!authParams.authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, events: [] };
  }

  const { calendarId, query, maxResults, timeMin, timeMax } = params;

  try {
    // First, fetch the calendar's timezone
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;
    const calendarRes: AxiosResponse = await axiosClient.get(calendarUrl, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
      },
    });

    const calendarTimezone = calendarRes.data.timeZone || "UTC";

    // Now fetch the events
    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const allEvents: googleOauthListCalendarEventsOutputType["events"] = [];
    let pageToken: string | undefined = undefined;
    let fetchedCount = 0;
    const max = maxResults ?? 250; // Default to 250 if not specified, Google API max is 250

    while (fetchedCount < max) {
      const res: AxiosResponse = await axiosClient.get(eventsUrl, {
        headers: {
          Authorization: `Bearer ${authParams.authToken}`,
        },
        params: {
          q: query,
          pageToken,
          maxResults: Math.min(250, max - fetchedCount), // Google API max is 250
          singleEvents: true,
          orderBy: "startTime",
          timeMin,
          timeMax,
          timeZone: calendarTimezone, // Include the calendar's timezone in the request
        },
      });

      const { items = [], nextPageToken = undefined } = res.data;
      if (!Array.isArray(items) || items.length <= 0) break;

      const batch = items.slice(0, max - fetchedCount);
      allEvents.push(
        ...batch.map(
          ({
            id,
            status,
            htmlLink,
            summary,
            description,
            location,
            start,
            end,
            attendees,
            organizer,
            hangoutLink,
            created,
            updated,
            attachments,
            eventType,
            transparency,
          }) => ({
            id,
            status,
            url: htmlLink,
            title: summary,
            description,
            location,
            start: start?.dateTime || start?.date || "",
            startDayOfWeek: getDayOfWeek(start?.dateTime || start?.date || ""),
            end: end?.dateTime || end?.date || "",
            endDayOfWeek: getDayOfWeek(end?.dateTime || end?.date || ""),
            attendees: Array.isArray(attendees)
              ? attendees.map(({ email, displayName, responseStatus }) => ({
                  email,
                  displayName,
                  responseStatus,
                }))
              : [],
            organizer: organizer
              ? {
                  email: organizer.email,
                  displayName: organizer.displayName,
                }
              : undefined,
            hangoutLink,
            created,
            updated,
            attachments: Array.isArray(attachments)
              ? attachments.map(({ fileId, fileUrl, title, mimeType }) => ({
                  fileId,
                  fileUrl,
                  title,
                  mimeType,
                }))
              : [],
            ...(eventType === "workingLocation" && { eventType }),
            ...(transparency === "transparent" && { transparency: "free" }),
          }),
        ),
      );

      fetchedCount = allEvents.length;
      if (!nextPageToken || fetchedCount >= max) break;
      pageToken = nextPageToken;
    }

    return {
      success: true,
      events: allEvents,
      timezone: calendarTimezone, // Include the calendar's timezone in the response
    };
  } catch (error) {
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : "Unknown error listing events",
    };
  }
};

export default listCalendarEvents;
