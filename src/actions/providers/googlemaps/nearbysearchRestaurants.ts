import type {
  googlemapsNearbysearchRestaurantsFunction,
  googlemapsNearbysearchRestaurantsParamsType,
  googlemapsNearbysearchRestaurantsOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { googlemapsNearbysearchRestaurantsOutputSchema } from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";

interface NearbySearchResult {
  displayName?: {
    text: string;
  };
  formattedAddress?: string;
  priceLevel?: string;
  rating?: number;
  primaryTypeDisplayName?: {
    text: string;
  };
  editorialSummary?: {
    text: string;
  };
  regularOpeningHours?: {
    weekdayDescriptions: string[];
  };
  websiteUri?: string;
}

const INCLUDED_TYPES = ["restaurant"];

const nearbysearchRestaurants: googlemapsNearbysearchRestaurantsFunction = async ({
  params,
  authParams,
}: {
  params: googlemapsNearbysearchRestaurantsParamsType;
  authParams: AuthParamsType;
}): Promise<googlemapsNearbysearchRestaurantsOutputType> => {
  const url = `https://places.googleapis.com/v1/places:searchNearby`;

  const fieldMask = [
    "places.displayName",
    "places.formattedAddress",
    "places.priceLevel",
    "places.rating",
    "places.primaryTypeDisplayName",
    "places.editorialSummary",
    "places.regularOpeningHours",
    "places.websiteUri",
  ].join(",");
  const response = await axiosClient.post<{ places: NearbySearchResult[] }>(
    url,
    {
      maxResultCount: 20,
      includedTypes: INCLUDED_TYPES,
      locationRestriction: {
        circle: {
          center: {
            latitude: params.latitude,
            longitude: params.longitude,
          },
          radius: 5000,
        },
      },
    },
    {
      headers: {
        "X-Goog-Api-Key": authParams.apiKey,
        "X-Goog-FieldMask": fieldMask,
        "Content-Type": "application/json",
      },
    },
  );

  return googlemapsNearbysearchRestaurantsOutputSchema.parse({
    success: true,
    results: response.data.places.map((place: NearbySearchResult) => ({
      name: place.displayName?.text || "Unknown",
      url: place.websiteUri || `https://maps.google.com/?q=${encodeURIComponent(place.formattedAddress || "")}`,
      contents: {
        name: place.displayName?.text || "Unknown",
        address: place.formattedAddress || "",
        priceLevel: place.priceLevel || "",
        rating: place.rating || 0,
        primaryType: place.primaryTypeDisplayName?.text || "",
        editorialSummary: place.editorialSummary?.text || "",
        openingHours: place.regularOpeningHours?.weekdayDescriptions?.join("\n") || "",
        websiteUri: place.websiteUri || "",
      },
    })),
  });
};

export default nearbysearchRestaurants;
