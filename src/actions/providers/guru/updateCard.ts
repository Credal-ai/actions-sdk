import type {
  AuthParamsType,
  guruUpdateGuruCardFunction,
  guruUpdateGuruCardOutputType,
  guruUpdateGuruCardParamsType,
} from "../../autogen/types.js";
import { basicAuthHeader } from "../../../utils/basicAuth.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const updateGuruCard: guruUpdateGuruCardFunction = async ({
  params,
  authParams,
}: {
  params: guruUpdateGuruCardParamsType;
  authParams: AuthParamsType;
}): Promise<guruUpdateGuruCardOutputType> => {
  const { authToken } = authParams;
  const { cardId, title, content } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  // Build the update payload, only including fields that are provided
  const updatePayload: Record<string, string> = {};
  if (title !== null && title !== undefined) updatePayload.preferredPhrase = title;
  if (content !== null && content !== undefined) updatePayload.content = content;

  const res = await fetch(`https://api.getguru.com/api/v1/cards/${cardId}/extended`, {
    method: "PUT",
    headers: {
      Authorization: basicAuthHeader(authToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatePayload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Guru update failed: ${res.status} - ${errorText}`);
  }

  const c = await res.json() as Record<string, unknown>;
  return {
    id: String(c.id || ""),
    url: c.slug ? `https://app.getguru.com/card/${c.slug}` : "",
    title: String(c.preferredPhrase || title || "Updated Card"),
    excerpt: String(c.content || "").substring(0, 200) || "",
  };
};

export default updateGuruCard;
