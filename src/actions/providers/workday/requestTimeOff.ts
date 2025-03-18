import {
    AuthParamsType,
    workdayRequestTimeOffFunction,
    workdayRequestTimeOffOutputType,
    workdayRequestTimeOffParamsType,
} from "../../autogen/types";

const axios = require("axios");


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
    
    try {
        const workerIdRequestBody = const response = await axios.get(`${BASE_URL}/workers`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            params: {
                email: email
            }
        });
            

        const timeOffRequestBody = {
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
            `${baseUrl}/Absence_Management/v43.2/Enter_Time_Off`,
            timeOffRequestBody,
            {
                headers: {
                    Authorization: `Basic ${apiKey}`,
                    "Content-Type": "application/json",
                },
            },
        );

        console.log("Time-off request submitted successfully:", response.data);
        return response.data;
    } catch (error) {
        return { requestId: "Error" };
    }
};

export default requestTimeOff;