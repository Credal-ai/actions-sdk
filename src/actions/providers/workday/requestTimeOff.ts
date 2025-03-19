import {
  AuthParamsType,
  workdayRequestTimeOffFunction,
  workdayRequestTimeOffOutputType,
  workdayRequestTimeOffParamsType,
} from "../../autogen/types";
import axios from "axios";

const requestTimeOff: workdayRequestTimeOffFunction = async ({
  params,
  authParams,
}: {
  params: workdayRequestTimeOffParamsType;
  authParams: AuthParamsType;
}): Promise<workdayRequestTimeOffOutputType> => {
  const { userEmail, startDate, endDate, timeOffType } = params;
  const { subdomain, clientId, clientSecret } = authParams;
  if (!subdomain || !clientId || !clientSecret) {
    throw new Error("Missing required auth params: subdomain, clientId, clientSecret");
  }

  const baseUrl = `https://${subdomain}.workday.com/ccx/service`;
  const apiKey = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    // 1) Get all employees
    //    Adjust the endpoint path and query parameters as needed for your Workday setup.
    const employeesResponse = await axios.get(`${baseUrl}/Human_Resources/v1/workers`, {
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      params: { email: userEmail },
    });

    const employeesData = employeesResponse.data;

    // 2) Find the worker ID for the matching user email
    //    The structure below is an example—adapt based on how your employees data is actually returned.
    let workerId = "";
    if (employeesData && employeesData.workers && Array.isArray(employeesData.workers)) {
      const matchingEmployee = employeesData.workers.find((worker: any) => worker.primaryEmail === userEmail);
      if (matchingEmployee) {
        workerId = matchingEmployee.id;
      }
    }

    if (!workerId) {
      throw new Error(`No matching worker found for email: ${userEmail}`);
    }

    // 3) Construct the time-off request body
    const timeOffRequestBody = {
      "wd:Enter_Time_Off_Request": {
        "wd:Worker_Reference": {
          "wd:ID": [
            {
              _: workerId,
              $: { "wd:type": "WID" },
            },
          ],
        },
        "wd:Time_Off_Entries": [
          {
            "wd:Start_Date": startDate,
            "wd:End_Date": endDate,
            "wd:Time_Off_Type_Reference": {
              "wd:ID": [
                {
                  _: timeOffType,
                  $: { "wd:type": "Time_Off_Type_ID" },
                },
              ],
            },
          },
        ],
      },
    };

    // 4) Submit the time-off request (Absence Management endpoint)
    const response = await axios.post(`${baseUrl}/Absence_Management/v43.2/Enter_Time_Off`, timeOffRequestBody, {
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Time-off request submitted successfully:", response.data);
    return response.data;
  } catch (error) {
    return { requestId: "Error" };
  }
};

export default requestTimeOff;
