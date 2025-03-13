import {
  googlemapsValidateAddressFunction,
  googlemapsValidateAddressParamsType,
  googlemapsValidateAddressOutputType,
  AuthParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

const validateAddress: googlemapsValidateAddressFunction = async ({
  params,
  authParams,
}: {
  params: googlemapsValidateAddressParamsType;
  authParams: AuthParamsType;
}): Promise<googlemapsValidateAddressOutputType> => {
  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${authParams.apiKey}`;

  const requestBody = {
    address: {
      addressLines: [...params.addressLines, params.locality, params.regionCode, params.postalCode],
    },
  };

  const response = await axiosClient.post<googlemapsValidateAddressOutputType>(url, requestBody, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

export default validateAddress;
