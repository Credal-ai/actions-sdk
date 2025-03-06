import axios from "axios";
import {
  googlemapsNearbysearchFunction,
  googlemapsNearbysearchParamsType,
  googlemapsNearbysearchOutputType,
  googlemapsNearbysearchOutputSchema,
  AuthParamsType,
} from "../../autogen/types";

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
}

const INCLUDED_TYPES = [
  "monument",
  "museum",
  "art_gallery",
  "sculpture",
  "cultural_landmark",
  "historical_place",
  "performing_arts_theater",
  "university",
  "aquarium",
  "botanical_garden",
  "comedy_club",
  "park",
  "movie_theater",
  "national_park",
  "garden",
  "night_club",
  "tourist_attraction",
  "water_park",
  "zoo",
  "bar",
  "restaurant",
  "food_court",
  "bakery",
  "cafe",
  "coffee_shop",
  "pub",
  "wine_bar",
  "spa",
  "beach",
  "market",
  "shopping_mall",
  "stadium",
];

const nearbysearch: googlemapsNearbysearchFunction = async ({
  params,
  authParams,
}: {
  params: googlemapsNearbysearchParamsType;
  authParams: AuthParamsType;
}): Promise<googlemapsNearbysearchOutputType> => {
  const url = `https://places.googleapis.com/v1/places:searchNearby`;

  const fieldMask = [
    "places.displayName",
    "places.formattedAddress",
    "places.priceLevel",
    "places.rating",
    "places.primaryTypeDisplayName",
    "places.editorialSummary",
    "places.regularOpeningHours",
  ].join(",");
  const response = await axios.post<{ places: NearbySearchResult[] }>(
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
          radius: 10000,
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

  return googlemapsNearbysearchOutputSchema.parse({
    results: response.data.places.map((place: NearbySearchResult) => ({
      name: place.displayName.text,
      address: place.formattedAddress,
      priceLevel: place.priceLevel,
      rating: place.rating,
      primaryType: place.primaryTypeDisplayName.text,
      editorialSummary: place.editorialSummary?.text || "",
      openingHours: place.regularOpeningHours?.weekdayDescriptions.join("\n") || "",
    })),
  });
};

export default nearbysearch;
