import type {
  AuthParamsType,
  guruSearchGuruCardsFunction,
  guruSearchGuruCardsOutputType,
  guruSearchGuruCardsParamsType,
} from "../../autogen/types.js";
import { basicAuthHeader } from "../../../utils/basicAuth.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";

const searchGuruCards: guruSearchGuruCardsFunction = async ({
  params,
  authParams,
}: {
  params: guruSearchGuruCardsParamsType;
  authParams: AuthParamsType;
}): Promise<guruSearchGuruCardsOutputType> => {
  const { authToken } = authParams;
  const { query, collectionId, limit = 20 } = params;

  if (!authToken) {
    throw new Error(MISSING_AUTH_TOKEN);
  }

  const url = new URL("https://api.getguru.com/api/v1/search/cardmgr");
  url.searchParams.set("searchTerms", query);
  if (collectionId) url.searchParams.set("collectionId", collectionId);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: basicAuthHeader(authToken) },
  });

  if (!res.ok) throw new Error(`Guru search failed: ${res.status}`);

  const data = (await res.json()) as Record<string, unknown>[];

  return {
    results: data.map(c => ({
      id: String(c.id || ""),
      url: c.slug ? `https://app.getguru.com/card/${c.slug}` : "",
      title: String(c.preferredPhrase || "Untitled Card"),
      excerpt:
        Array.isArray(c.highlightedBodyContent) && (c.highlightedBodyContent as string[]).length > 0
          ? (c.highlightedBodyContent as string[])[0].replace(/\.\.\./g, "").trim()
          : String(c.content || "").substring(0, 200) || "",
    })),
  };
};

export default searchGuruCards;
