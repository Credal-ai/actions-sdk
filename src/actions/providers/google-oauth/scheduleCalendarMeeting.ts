import { v4 } from "uuid";
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
    throw new Error("authToken is required for Google Calendar API");
  }
  const { calendarId, name, start, end, description, attendees, useGoogleMeet } = params;
  // https://developers.google.com/calendar/api/v3/reference/events/insert
  let createEventApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

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
    conferenceData?: {
      createRequest: {
        requestId: string;
      };
    };
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

  if (useGoogleMeet) {
    createEventApiUrl += "?conferenceDataVersion=1";
    data.conferenceData = {
      createRequest: {
        requestId: v4(),
      },
    };
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
