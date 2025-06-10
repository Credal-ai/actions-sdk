import type {
  AuthParamsType,
  notionSearchByTitleFunction,
  notionSearchByTitleOutputType,
  notionSearchByTitleParamsType,
} from "../../autogen/types.js";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants.js";
import axios from "axios";

interface NotionResult {
  object: "database";
  id: string;
  url: string;
  title?: { plain_text: string }[];
  properties: {
    [key: string]: {
      type: string;
      title?: { plain_text: string }[];
      rich_text?: { plain_text: string }[];
    };
  };
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
}

// Notion response is not standard for title, title can be in different places
// This function checks if the title is in the properties object
function isTitleProperty(prop: unknown): prop is { type: string; title: { plain_text: string }[] } {
  return (
    typeof prop === "object" &&
    prop !== null &&
    "type" in prop &&
    (prop as { type: string }).type === "title" &&
    "title" in prop &&
    Array.isArray((prop as { title: unknown }).title)
  );
}

const searchByTitle: notionSearchByTitleFunction = async ({
  params,
  authParams,
}: {
  params: notionSearchByTitleParamsType;
  authParams: AuthParamsType;
}): Promise<notionSearchByTitleOutputType> => {
  const { authToken } = authParams;
  const { query } = params;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN, results: [] };
  }

  try {
    const response = await axios.post(
      "https://api.notion.com/v1/search",
      { query },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      },
    );

    const { results: notionResults = [] } = response.data;

    const results: SearchResult[] =
      (notionResults as NotionResult[]).map((item: NotionResult): SearchResult => {
        let title = "";

        // Try to find a title property in properties (for pages)
        if (item.properties) {
          const titleProp = Object.values(item.properties).find(isTitleProperty);
          if (titleProp && Array.isArray(titleProp.title)) {
            title = titleProp.title.map(t => t.plain_text).join("") || "";
          }
        }

        // If still no title, try item.title (for databases)
        if (!title && Array.isArray(item.title)) {
          title = item.title.map(t => t.plain_text).join("") || "";
        }

        return {
          id: item.id,
          title,
          url: item.url,
        };
      }) || [];

    return { success: true, results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    };
  }
};

export default searchByTitle;
