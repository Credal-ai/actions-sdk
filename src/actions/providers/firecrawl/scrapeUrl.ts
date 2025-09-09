import FirecrawlApp from "@mendable/firecrawl-js";
import type {
  firecrawlScrapeUrlFunction,
  firecrawlScrapeUrlParamsType,
  firecrawlScrapeUrlOutputType,
  AuthParamsType,
} from "../../autogen/types.js";
import { firecrawlScrapeUrlOutputSchema } from "../../autogen/types.js";

const scrapeUrl: firecrawlScrapeUrlFunction = async ({
  params,
  authParams,
}: {
  params: firecrawlScrapeUrlParamsType;
  authParams: AuthParamsType;
}): Promise<firecrawlScrapeUrlOutputType> => {
  const firecrawl = new FirecrawlApp({
    apiKey: authParams.apiKey,
  });

  const result = await firecrawl.scrapeUrl(params.url, {
    ...(params.waitMs !== undefined && {
      actions: [{ type: "wait", milliseconds: params.waitMs }],
    }),
    ...(params.onlyMainContent !== undefined && {
      onlyMainContent: params.onlyMainContent,
    }),
    ...(params.formats !== undefined &&
      params.formats.length > 0 && {
        formats: params.formats,
      }),
  });

  console.log("Result is: ", result);

  if (!result.success) {
    return firecrawlScrapeUrlOutputSchema.parse({
      content: "",
    });
  }

  // Extract content based on requested formats
  let content = "";
  if (params.formats && params.formats.length > 0) {
    const contentParts: string[] = [];

    for (const format of params.formats) {
      let formatContent: string | undefined = undefined;

      // Handle different format mappings
      switch (format) {
        case "rawHtml":
          formatContent = result.rawHtml;
          break;
        case "markdown":
          formatContent = result.markdown;
          break;
        case "html":
          formatContent = result.html;
          break;
        case "links":
          formatContent = Array.isArray(result.links)
            ? result.links.map(link => (typeof link === "string" ? link : JSON.stringify(link))).join("\n")
            : JSON.stringify(result.links);
          break;
        case "json":
          formatContent = result.json ? JSON.stringify(result.json, null, 2) : undefined;
          break;
        case "extract":
          formatContent = result.extract ? JSON.stringify(result.extract, null, 2) : undefined;
          break;
        case "screenshot":
          formatContent = result.screenshot;
          break;
        case "changeTracking":
          formatContent = result.changeTracking ? JSON.stringify(result.changeTracking, null, 2) : undefined;
          break;
        default:
          formatContent = result[format as keyof typeof result];
      }

      if (formatContent) {
        const formatHeader = `=== ${format.toUpperCase()} ===`;
        contentParts.push(`${formatHeader}\n${formatContent}`);
      }
    }

    content = contentParts.join("\n\n");
  } else {
    // Default to markdown if no formats specified
    content = result.markdown || "";
  }

  return firecrawlScrapeUrlOutputSchema.parse({
    content,
  });
};

export default scrapeUrl;
