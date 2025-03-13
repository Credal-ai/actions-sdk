import {
  googlemapsNearbysearchRestaurantsFunction,
  googlemapsNearbysearchRestaurantsParamsType,
  googlemapsNearbysearchRestaurantsOutputType,
  googlemapsNearbysearchRestaurantsOutputSchema,
  AuthParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

interface NearbySearchResult {
  displayName: {
    text: string;
  };
  formattedAddress: string;
  priceLevel: string;
  rating: number;
  primaryTypeDisplayName: {
    text: string;
  };
  editorialSummary:
    | {
        text: string;
      }
    | undefined;
  regularOpeningHours:
    | {
        weekdayDescriptions: string[];
      }
    | undefined;
  websiteUri: string;
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
    results: response.data.places.map((place: NearbySearchResult) => ({
      name: place.displayName.text,
      address: place.formattedAddress,
      priceLevel: place.priceLevel,
      rating: place.rating,
      primaryType: place.primaryTypeDisplayName.text,
      editorialSummary: place.editorialSummary?.text || "",
      openingHours: place.regularOpeningHours?.weekdayDescriptions.join("\n") || "",
      websiteUri: place.websiteUri,
    })),
  });
};

export default nearbysearchRestaurants;
