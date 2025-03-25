import {
  AuthParamsType,
  googleOauthScheduleCalendarMeetingFunction,
  googleOauthScheduleCalendarMeetingOutputType,
  googleOauthScheduleCalendarMeetingParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

/**
 * Creates a new Google calendar event using OAuth authentication
 */
const scheduleCalendarMeeting: googleOauthScheduleCalendarMeetingFunction = async ({
  params,
  authParams,
}: {
  params: googleOauthScheduleCalendarMeetingParamsType;
  authParams: AuthParamsType;
}): Promise<googleOauthScheduleCalendarMeetingOutputType> => {
  if (!authParams.authToken) {
    throw new Error("authToken is required for Google Docs API");
  }
  const { calendarId, name, start, end, description, attendees } = params;
  // https://developers.google.com/calendar/api/v3/reference/events/insert
  const createEventApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

  const data: {
    summary: string;
    start: {
      dateTime: string;
    };
    end: {
      dateTime: string;
    };
    description?: string;
    attendees?: { email: string }[];
  } = {
    summary: name,
    start: {
      dateTime: start,
    },
    end: {
      dateTime: end,
    },
  };

  if (description) {
    data.description = description;
  }

  if (attendees) {
    data.attendees = attendees.map(attendee => ({ email: attendee }));
  }

  const response = await axiosClient.post(createEventApiUrl, data, {
    headers: {
      Authorization: `Bearer ${authParams.authToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status !== 200) {
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
};

export default scheduleCalendarMeeting;
