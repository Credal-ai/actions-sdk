import type { AxiosInstance } from "axios";
import { isAxiosTimeoutError } from "../actions/util/axiosClient.js";

// Custom interfaces to replace googleapis types
interface GoogleDocsDocument {
  body?: {
    content?: Array<{
      paragraph?: {
        elements?: Array<{
          textRun?: {
            content?: string;
          };
        }>;
        paragraphStyle?: {
          headingId?: string;
          namedStyleType?: string;
        };
        bullet?: {
          nestingLevel?: number;
        };
      };
      table?: {
        tableRows?: Array<{
          tableCells?: Array<{
            content?: Array<{
              paragraph?: {
                elements?: Array<{
                  textRun?: {
                    content?: string;
                  };
                }>;
              };
            }>;
          }>;
        }>;
      };
      sectionBreak?: unknown;
      tableOfContents?: {
        content?: Array<{
          paragraph?: {
            elements?: Array<{
              textRun?: {
                content?: string;
              };
            }>;
          };
        }>;
      };
    }>;
  };
}

interface GoogleSheetsSpreadsheet {
  sheets?: Array<{
    properties?: {
      title?: string;
    };
    data?: Array<{
      rowData?: Array<{
        values?: Array<{
          formattedValue?: string;
          userEnteredValue?: {
            stringValue?: string;
            numberValue?: number;
            boolValue?: boolean;
          };
        }>;
      }>;
    }>;
  }>;
}

interface GoogleSlidesPresentation {
  slides?: Array<{
    pageElements?: Array<{
      shape?: {
        text?: {
          textElements?: Array<{
            textRun?: {
              content?: string;
            };
          }>;
        };
      };
      table?: {
        tableRows?: Array<{
          tableCells?: Array<{
            text?: {
              textElements?: Array<{
                textRun?: {
                  content?: string;
                };
              }>;
            };
          }>;
        }>;
      };
      line?: {
        text?: {
          textElements?: Array<{
            textRun?: {
              content?: string;
            };
          }>;
        };
      };
      wordArt?: {
        text?: {
          textElements?: Array<{
            textRun?: {
              content?: string;
            };
          }>;
        };
      };
    }>;
    notesProperties?: {
      speakerNotesObjectId?: string;
    };
  }>;
  notesMaster?: {
    pageElements?: Array<{
      shape?: {
        text?: {
          textElements?: Array<{
            textRun?: {
              content?: string;
            };
          }>;
        };
      };
    }>;
  };
}

type DocSection = {
  heading: { id: string; type: string } | undefined;
  paragraphs: string[];
};

// Helper function to parse Google Docs content to plain text
export function parseGoogleDocFromRawContentToPlainText(snapshotRawContent: GoogleDocsDocument): string {
  const docSections: DocSection[] = [
    {
      heading: undefined,
      paragraphs: [],
    },
  ];

  if (!snapshotRawContent.body?.content) return "";

  for (const content of snapshotRawContent.body.content) {
    if (!content) continue;

    // Handle paragraphs (existing logic)
    if (content.paragraph) {
      const paragraph = content.paragraph;

      if (paragraph.paragraphStyle?.headingId) {
        // New heading
        docSections.push({
          heading: {
            id: paragraph.paragraphStyle.headingId,
            type: paragraph.paragraphStyle.namedStyleType || "",
          },
          paragraphs: [],
        });
      }

      if (paragraph?.elements) {
        const combinedTextRuns = paragraph.elements
          .map(element => element.textRun?.content)
          .filter((content): content is string => Boolean(content))
          .join("");

        const bulletNestingLevel = paragraph.bullet === undefined ? undefined : (paragraph.bullet?.nestingLevel ?? 0);
        const paragraphContent =
          bulletNestingLevel === undefined
            ? combinedTextRuns
            : "\t".repeat(bulletNestingLevel) + " • " + combinedTextRuns;

        docSections[docSections.length - 1]!.paragraphs.push(paragraphContent);
      }
    }

    // Handle tables
    if (content.table) {
      const table = content.table;
      const tableText: string[] = [];

      if (table.tableRows) {
        for (const row of table.tableRows) {
          if (!row.tableCells) continue;

          const cellTexts: string[] = [];
          for (const cell of row.tableCells) {
            if (!cell.content) continue;

            const cellText: string[] = [];
            for (const cellContent of cell.content) {
              if (cellContent.paragraph?.elements) {
                const cellParagraphText = cellContent.paragraph.elements
                  .map(element => element.textRun?.content)
                  .filter((content): content is string => Boolean(content))
                  .join("");
                if (cellParagraphText.trim()) {
                  cellText.push(cellParagraphText.trim());
                }
              }
            }
            cellTexts.push(cellText.join(" "));
          }

          if (cellTexts.some(text => text.trim())) {
            tableText.push(cellTexts.join(" | "));
          }
        }
      }

      if (tableText.length > 0) {
        docSections[docSections.length - 1]!.paragraphs.push(tableText.join("\n"));
      }
    }

    // Handle section breaks (just in case they contain text)
    if (content.sectionBreak) {
      // Section breaks typically don't contain text, but we'll check anyway
      // This is mostly for completeness
      continue;
    }

    // Handle table of contents (extract any text)
    if (content.tableOfContents) {
      const toc = content.tableOfContents;
      if (toc.content) {
        const tocText: string[] = [];
        for (const tocContent of toc.content) {
          if (tocContent.paragraph?.elements) {
            const tocParagraphText = tocContent.paragraph.elements
              .map(element => element.textRun?.content)
              .filter((content): content is string => Boolean(content))
              .join("");
            if (tocParagraphText.trim()) {
              tocText.push(tocParagraphText.trim());
            }
          }
        }
        if (tocText.length > 0) {
          docSections[docSections.length - 1]!.paragraphs.push(tocText.join("\n"));
        }
      }
    }
  }

  const validDocSections = docSections.filter(section => section.heading || section.paragraphs.length > 0);
  return validDocSections.map(section => section.paragraphs.join(" ")).join("\n");
}

export function parseGoogleSheetsFromRawContentToPlainText(snapshotRawContent: GoogleSheetsSpreadsheet): string {
  if (!snapshotRawContent.sheets) return "";

  const sheetContents: string[] = [];

  for (const sheet of snapshotRawContent.sheets) {
    if (!sheet.data || !sheet.properties?.title) continue;

    const sheetTitle = sheet.properties.title;
    const sheetRows: string[] = [`Sheet: ${sheetTitle}`];

    for (const gridData of sheet.data) {
      if (!gridData.rowData) continue;

      for (const rowData of gridData.rowData) {
        if (!rowData.values) continue;

        const cellValues = rowData.values
          .map(cell => {
            if (cell.formattedValue) return cell.formattedValue;
            if (cell.userEnteredValue?.stringValue) return cell.userEnteredValue.stringValue;
            if (cell.userEnteredValue?.numberValue) return cell.userEnteredValue.numberValue.toString();
            if (cell.userEnteredValue?.boolValue) return cell.userEnteredValue.boolValue.toString();
            return "";
          })
          .filter(value => value !== "");

        if (cellValues.length > 0) {
          sheetRows.push(cellValues.join(" | "));
        }
      }
    }

    if (sheetRows.length > 1) {
      sheetContents.push(sheetRows.join("\n"));
    }
  }

  return sheetContents.join("\n\n");
}

export function parseGoogleSlidesFromRawContentToPlainText(snapshotRawContent: GoogleSlidesPresentation): string {
  if (!snapshotRawContent.slides) return "";

  const slideContents: string[] = [];

  // Helper function to extract text from textElements
  const extractTextFromElements = (textElements?: Array<{textRun?: {content?: string}}>): string[] => {
    if (!textElements) return [];
    return textElements
      .map(el => el.textRun?.content?.trim())
      .filter((content): content is string => Boolean(content));
  };

  for (const slide of snapshotRawContent.slides) {
    if (!slide.pageElements) continue;

    const slideTexts: string[] = [];

    for (const pageElement of slide.pageElements) {
      // Extract text from shapes
      if (pageElement.shape?.text?.textElements) {
        const shapeTexts = extractTextFromElements(pageElement.shape.text.textElements);
        slideTexts.push(...shapeTexts);
      }

      // Extract text from tables
      if (pageElement.table?.tableRows) {
        for (const row of pageElement.table.tableRows) {
          if (!row.tableCells) continue;
          for (const cell of row.tableCells) {
            if (cell.text?.textElements) {
              const cellTexts = extractTextFromElements(cell.text.textElements);
              slideTexts.push(...cellTexts);
            }
          }
        }
      }

      // Extract text from lines
      if (pageElement.line?.text?.textElements) {
        const lineTexts = extractTextFromElements(pageElement.line.text.textElements);
        slideTexts.push(...lineTexts);
      }

      // Extract text from wordArt
      if (pageElement.wordArt?.text?.textElements) {
        const wordArtTexts = extractTextFromElements(pageElement.wordArt.text.textElements);
        slideTexts.push(...wordArtTexts);
      }
    }

    if (slideTexts.length > 0) {
      slideContents.push(slideTexts.join(" "));
    }
  }

  // Also extract text from notes master if available
  if (snapshotRawContent.notesMaster?.pageElements) {
    const notesTexts: string[] = [];
    for (const pageElement of snapshotRawContent.notesMaster.pageElements) {
      if (pageElement.shape?.text?.textElements) {
        const shapeTexts = extractTextFromElements(pageElement.shape.text.textElements);
        notesTexts.push(...shapeTexts);
      }
    }
    if (notesTexts.length > 0) {
      slideContents.push(`Notes: ${notesTexts.join(" ")}`);
    }
  }

  return slideContents.join("\n\n");
}

/** Specific to google docs */

const GDRIVE_BASE_URL = "https://www.googleapis.com/drive/v3/files/";

interface GoogleDocTab {
  tabId: string;
  documentTab: GoogleDocsDocument;
  childTabs?: GoogleDocTab[];
}

/**
 * Given a Google Doc file ID and an OAuth auth token, this function will fetch the
 * contents of the Google Doc and recursively fetch all of the tab contents.
 *
 * @param {string} fileId - The ID of the Google Doc file
 * @param {string} authToken - The OAuth token to use for authentication
 * @param {AxiosInstance} axiosClient - The axios client to use for making requests
 * @returns {Promise<string>} A promise that resolves with the text content of the doc
 */
async function getGoogleDocContentNoExport(
  fileId: string,
  authToken: string,
  axiosClient: AxiosInstance,
): Promise<string> {
  const docsUrl = `https://docs.googleapis.com/v1/documents/${fileId}?includeTabsContent=true`;
  const docsRes = await axiosClient.get(docsUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  const getAllTabs = (tabs: GoogleDocTab[]): GoogleDocTab[] => {
    const allTabs: GoogleDocTab[] = [];
    tabs.forEach((tab: GoogleDocTab) => {
      allTabs.push(tab);
      if (tab.childTabs) {
        allTabs.push(...getAllTabs(tab.childTabs));
      }
    });
    return allTabs;
  };

  const tabs = docsRes.data.tabs || [];
  const allTabs = getAllTabs(tabs);

  const tabContents = allTabs.map((tab: GoogleDocTab) => parseGoogleDocFromRawContentToPlainText(tab.documentTab));

  return tabContents.join("\n\n");
}

export async function getGoogleDocContent(
  fileId: string,
  authToken: string,
  axiosClient: AxiosInstance,
  sharedDriveParams: string,
): Promise<string> {
  try {
    return await getGoogleDocContentNoExport(fileId, authToken, axiosClient);
  } catch (docsError) {
    if (isAxiosTimeoutError(docsError)) {
      console.log("Request timed out using Google Docs API - dont retry");
      throw new Error("Request timed out using Google Docs API");
    } else {
      console.log("Error using Google Docs API", docsError);
      // Fallback to Drive API export if Docs API fails
      const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: "text",
      });
      return exportRes.data;
    }
  }
}

export async function getGoogleSheetContent(
  fileId: string,
  authToken: string,
  axiosClient: AxiosInstance,
  sharedDriveParams: string,
): Promise<string> {
  try {
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=true`;
    const sheetsRes = await axiosClient.get(sheetsUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return parseGoogleSheetsFromRawContentToPlainText(sheetsRes.data);
  } catch (sheetsError) {
    if (isAxiosTimeoutError(sheetsError)) {
      console.log("Request timed out using Google Sheets API - dont retry");
      throw new Error("Request timed out using Google Sheets API");
    } else {
      console.log("Error using Google Sheets API", sheetsError);
      const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/csv${sharedDriveParams}`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: "text",
      });
      return exportRes.data
        .split("\n")
        .map((line: string) => line.replace(/,+$/, ""))
        .map((line: string) => line.replace(/,{2,}/g, ","))
        .join("\n");
    }
  }
}

export async function getGoogleSlidesContent(
  fileId: string,
  authToken: string,
  axiosClient: AxiosInstance,
  sharedDriveParams: string,
): Promise<string> {
  try {
    const slidesUrl = `https://slides.googleapis.com/v1/presentations/${fileId}`;
    const slidesRes = await axiosClient.get(slidesUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return parseGoogleSlidesFromRawContentToPlainText(slidesRes.data);
  } catch (slidesError) {
    if (isAxiosTimeoutError(slidesError)) {
      console.log("Request timed out using Google Slides API - dont retry");
      throw new Error("Request timed out using Google Slides API");
    } else {
      console.log("Error using Google Slides API", slidesError);
      const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: "text",
      });
      return exportRes.data;
    }
  }
}
