import { v4 } from "uuid";
import type {
  AuthParamsType,
  googleOauthScheduleCalendarMeetingFunction,
  googleOauthScheduleCalendarMeetingOutputType,
  googleOauthScheduleCalendarMeetingParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

/**
 * Generates a recurrence rule (RRULE) based on the recurrence parameters
 */
function generateRecurrenceRule(
  recurrence: NonNullable<googleOauthScheduleCalendarMeetingParamsType["recurrence"]>,
): string {
  let rrule = `RRULE:FREQ=${recurrence.frequency}`;

  if (recurrence.interval) {
    rrule += `;INTERVAL=${recurrence.interval}`;
  }

  if (recurrence.count) {
    rrule += `;COUNT=${recurrence.count}`;
  }

  if (recurrence.until) {
    const date = new Date(recurrence.until);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    const second = String(date.getUTCSeconds()).padStart(2, "0");
    rrule += `;UNTIL=${year}${month}${day}T${hour}${minute}${second}Z`; // trufflehog:ignore
  }

  if (recurrence.byDay && recurrence.byDay.length > 0) {
    rrule += `;BYDAY=${recurrence.byDay.join(",")}`;
  }

  if (recurrence.byMonthDay && recurrence.byMonthDay.length > 0) {
    rrule += `;BYMONTHDAY=${recurrence.byMonthDay.join(",")}`;
  }

  return rrule;
}

/**
 * Creates a new Google calendar event using OAuth authentication
 * Supports both one-time and recurring meetings
 */
const scheduleCalendarMeeting: googleOauthScheduleCalendarMeetingFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthScheduleCalendarMeetingParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthScheduleCalendarMeetingOutputType> => {
  if (!authParams.authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }
  const { calendarId, name, start, end, description, attendees, useGoogleMeet, timeZone, recurrence } = params;
  // https://developers.google.com/calendar/api/v3/reference/events/insert
  let createEventApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const data: {
    summary: string;
    start: {
      dateTime: string;
      timeZone?: string;
    };
    end: {
      dateTime: string;
      timeZone?: string;
    };
    description?: string;
    attendees?: { email: string }[];
    conferenceData?: {
      createRequest: {
        requestId: string;
      };
    };
    recurrence?: string[];
  } = {
    summary: name,
    start: {
      dateTime: start,
      ...(timeZone ? { timeZone } : { timeZone: "UTC" }),
    },
    end: {
      dateTime: end,
      ...(timeZone ? { timeZone } : { timeZone: "UTC" }),
    },
  };

  if (description) {
    data.description = description;
  }

  if (attendees) {
    data.attendees = attendees.map(attendee => ({ email: attendee }));
  }

  if (useGoogleMeet) {
    createEventApiUrl += "?conferenceDataVersion=1";
    data.conferenceData = {
      createRequest: {
        requestId: v4(),
      },
    };
  }

  // Add recurrence rule if specified
  if (recurrence) {
    try {
      const rrule = generateRecurrenceRule(recurrence);
      data.recurrence = [rrule];
    } catch (error) {
      console.error("Error generating recurrence rule", error);
      return {
        success: false,
        error: "Invalid recurrence configuration: " + (error instanceof Error ? error.message : "Unknown error"),
      };
    }
  }

  try {
    const response = await axiosClient.post(createEventApiUrl, data, {
      headers: {
        Authorization: `Bearer ${authParams.authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        error: response.data.error,
      };
    }

    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
    };
  } catch (error) {
    console.error("Error scheduling calendar meeting", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default scheduleCalendarMeeting;
