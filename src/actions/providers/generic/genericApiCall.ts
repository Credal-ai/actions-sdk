import axios from "axios";
import type {
  genericUniversalTestActionParamsType,
  genericUniversalTestActionOutputType,
  genericUniversalTestActionFunction,
} from "../../autogen/types";

const genericApiCall: genericUniversalTestActionFunction = async ({
  params,
}: {
  params: genericUniversalTestActionParamsType;
}): Promise<genericUniversalTestActionOutputType> => {
  try {
    const { endpoint, method, headers, body } = params;

    const response = await axios({
      url: endpoint,
      method,
      headers,
      data: method !== "GET" ? body : undefined,
    });

    return {
      statusCode: response.status,
      headers: response.headers as Record<string, string>,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw Error("Axios Error: " + (error.message || "Failed to make API call"));
    }
    throw Error("Error: " + (error || "Failed to make API call"));
  }
};

export default genericApiCall;
