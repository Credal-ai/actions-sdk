const axios = require("axios");

const WORKDAY_BASE_URL = "https://your-workday-url/ccx/service/YOUR_TENANT/Absence_Management/v43.2";
const TOKEN_URL = "https://your-workday-url/oauth2/YOUR_TENANT/token"; // OAuth token endpoint

const CLIENT_ID = "your-client-id";
const CLIENT_SECRET = "your-client-secret";

/**
 * Fetches an OAuth 2.0 access token from Workday.
 */
async function getAccessToken() {
    try {
        const response = await axios.post(
            TOKEN_URL,
            new URLSearchParams({ grant_type: "client_credentials" }),
            {
                auth: {
                    username: CLIENT_ID,
                    password: CLIENT_SECRET
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Error fetching access token:", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Submits a time-off request to Workday.
 * @param {Object} params - Time-off details.
 * @param {string} params.workerId - Worker's ID in Workday.
 * @param {string} params.startDate - Start date (YYYY-MM-DD).
 * @param {string} params.endDate - End date (YYYY-MM-DD).
 * @param {string} params.timeOffType - Time-off type (e.g., "SICK_LEAVE").
 */
async function submitTimeOff({ workerId, startDate, endDate, timeOffType }) {
    try {
        const token = await getAccessToken(); // Get OAuth token

        const requestBody = {
            "wd:Enter_Time_Off_Request": {
                "wd:Worker_Reference": {
                    "wd:ID": [{ "_": workerId, "$": { "wd:type": "WID" } }]
                },
                "wd:Time_Off_Entries": [
                    {
                        "wd:Start_Date": startDate,
                        "wd:End_Date": endDate,
                        "wd:Time_Off_Type_Reference": {
                            "wd:ID": [{ "_": timeOffType, "$": { "wd:type": "Time_Off_Type_ID" } }]
                        }
                    }
                ]
            }
        };

        const response = await axios.post(
            `${WORKDAY_BASE_URL}/Enter_Time_Off`,
            requestBody,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Time-off request submitted successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error submitting time-off request:", error.response?.data || error.message);
        throw error;
    }
}

// Example Usage:
submitTimeOff({
    workerId: "12345",
    startDate: "2025-03-10",
    endDate: "2025-03-12",
    timeOffType: "SICK_LEAVE"
}).then(console.log).catch(console.error);
