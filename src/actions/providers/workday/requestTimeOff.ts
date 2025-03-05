import {
  AuthParamsType,
  workdayRequestTimeOffFunction,
  workdayRequestTimeOffOutputSchema,
  workdayRequestTimeOffOutputType,
  workdayRequestTimeOffParamsType,
} from "../../autogen/types";

const axios = require("axios");

const WORKDAY_BASE_URL = "https://your-workday-url/ccx/service/{{YOUR_TENANT}}/Absence_Management/v43.2";

const requestTimeOff: workdayRequestTimeOffFunction = async ({
  params,
  authParams,
}: {
  params: workdayRequestTimeOffParamsType;
  authParams: AuthParamsType;
}): Promise<workdayRequestTimeOffOutputType> => {
  const { workerId, startDate, endDate, timeOffType, tenantName } = params;
  if (!workerId || !startDate || !endDate || !timeOffType) {
    throw new Error("Worker ID, start date, end date, and time-off type are required");
  }
  try {
    const { authToken } = authParams;
    const requestBody = {
      "wd:Enter_Time_Off_Request": {
        "wd:Worker_Reference": {
          "wd:ID": [{ _: workerId, $: { "wd:type": "WID" } }],
        },
        "wd:Time_Off_Entries": [
          {
            "wd:Start_Date": startDate,
            "wd:End_Date": endDate,
            "wd:Time_Off_Type_Reference": {
              "wd:ID": [{ _: timeOffType, $: { "wd:type": "Time_Off_Type_ID" } }],
            },
          },
        ],
      },
    };

    const response = await axios.post(
      `${WORKDAY_BASE_URL.replace("{{YOUR_TENANT}}", tenantName)}/Enter_Time_Off`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Time-off request submitted successfully:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
