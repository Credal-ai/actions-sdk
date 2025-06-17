import type {
  AuthParamsType,
  guruCreateGuruCardFunction,
  guruCreateGuruCardOutputType,
  guruCreateGuruCardParamsType,
} from "../../autogen/types.js";
import { basicAuthHeader } from "../../../utils/basicAuth.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const createGuruCard: guruCreateGuruCardFunction = async ({
  params,
  authParams,
}: {
  params: guruCreateGuruCardParamsType;
  authParams: AuthParamsType;
}): Promise<guruCreateGuruCardOutputType> => {
  const { authToken } = authParams;
  const { title, content, collectionId } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const payload = {
    preferredPhrase: title,
    content: content,
    collection: { id: collectionId },
    shareStatus: "TEAM",
  };

  const res = await fetch("https://api.getguru.com/api/v1/cards/extended", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(authToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Guru create failed: ${res.status} - ${errorText}`);
  }

  const c = await res.json();
  return {
    id: c.id,
    url: c.slug ? `https://app.getguru.com/card/${c.slug}` : "",
    title: c.preferredPhrase || title,
    excerpt: c.content?.substring(0, 200) || "",
  };
};

export default createGuruCard;
