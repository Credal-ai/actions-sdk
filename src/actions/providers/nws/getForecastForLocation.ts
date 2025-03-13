import {
  AuthParamsType,
  nwsGetForecastForLocationFunction,
  nwsGetForecastForLocationOutputType,
  nwsGetForecastForLocationParamsType,
} from "../../autogen/types";
import { isBetweenDatetime, isValidIsoDatestring } from "../../../utils/datetime";
import { axiosClient } from "../../util/axiosClient";
interface Period {
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  detailedForecast: string;
}

const getForecastForLocation: nwsGetForecastForLocationFunction = async ({
  params,
  authParams,
}: {
  params: nwsGetForecastForLocationParamsType;
  authParams: AuthParamsType;
}): Promise<nwsGetForecastForLocationOutputType> => {
  const { latitude, longitude, isoDate } = params;
  const { userAgent } = authParams;

  if (!isValidIsoDatestring(isoDate)) {
    throw new Error("Invalid ISO date format");
  }

  const url = `https://api.weather.gov/points/${latitude},${longitude}`;

  const pointsResponse = await axiosClient.get(url, { headers: { "User-Agent": userAgent } });

  const forecastUrl = pointsResponse.data.properties.forecast;
  const forecastResponse = await axiosClient.get(forecastUrl, {
    headers: { "User-Agent": userAgent },
  });
  const forecastData = forecastResponse.data;

  // Step 4: Filter for the target date
  const targetDateString = isoDate.split("T")[0];

  const relevantForecasts = forecastData.properties.periods.filter((period: Period) => {
    return isBetweenDatetime(targetDateString, period.startTime, period.endTime);
  });

  let result: nwsGetForecastForLocationOutputType["result"];
  if (relevantForecasts.length > 0) {
    result = {
      temperature: relevantForecasts[0].temperature,
      temperatureUnit: relevantForecasts[0].temperatureUnit,
      forecast: relevantForecasts[0].detailedForecast,
    };
  }

  return { result };
};

export default getForecastForLocation;
