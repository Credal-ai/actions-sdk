import { AxiosError } from "axios";
import { axiosClient } from "../../util/axiosClient";

export async function getUserAccountIdFromEmail(
  email: string,
  apiUrl: string,
  authToken: string,
): Promise<string | null> {
  try {
    const response = await axiosClient.get<Array<{ accountId: string; displayName: string; emailAddress: string }>>(
      `${apiUrl}/user/search?query=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      },
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].accountId;
    }
    return null;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error finding user:", axiosError.message);
    return null;
  }
}
