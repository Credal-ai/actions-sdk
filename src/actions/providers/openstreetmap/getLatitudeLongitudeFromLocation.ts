import type {
  AuthParamsType,
  openstreetmapGetLatitudeLongitudeFromLocationFunction,
  openstreetmapGetLatitudeLongitudeFromLocationOutputType,
  openstreetmapGetLatitudeLongitudeFromLocationParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const getLatitudeLongitudeFromLocation: openstreetmapGetLatitudeLongitudeFromLocationFunction = async ({
  params,
  authParams,
}: {
  params: openstreetmapGetLatitudeLongitudeFromLocationParamsType;
  authParams: AuthParamsType;
}): Promise<openstreetmapGetLatitudeLongitudeFromLocationOutputType> => {
  const { location } = params;
  const { userAgent } = authParams;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json`;

  const response = await axiosClient.get(url, { headers: { "User-Agent": userAgent } });

  return response.data.map((result: { lat: string; lon: string; display_name: string }) => ({
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    displayName: result.display_name,
  }));
};

export default getLatitudeLongitudeFromLocation;
