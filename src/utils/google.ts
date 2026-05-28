import type { AxiosInstance } from "axios";
import Papa from "papaparse";
import { read, utils } from "xlsx";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
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

// Helper to convert 0-based column index to Excel-style column letter (0 -> "A", 25 -> "Z", 26 -> "AA")
function columnIndexToLetter(index: number): string {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

// Helper to parse CSV string into the JSON sheet format
function parseCSVToSheetJson(csvData: string, sheetName: string = "Sheet1"): string {
  const headers: Array<{ column: string; header: string }> = [];
  const rows: Array<{ column: string; row: number; value: string }> = [];

  const parsed = Papa.parse<string[]>(csvData, {
    skipEmptyLines: true,
  });

  parsed.data.forEach((values, rowIndex) => {
    values.forEach((value, colIndex) => {
      const column = columnIndexToLetter(colIndex);

      if (rowIndex === 0) {
        // Headers: keep all cells (including empty) to preserve column positions
        headers.push({ column, header: value.trim() });
      } else {
        // Rows: skip empty or whitespace-only cells
        const trimmedValue = value.trim();
        if (!trimmedValue) return;
        rows.push({ column, row: rowIndex + 1, value: trimmedValue });
      }
    });
  });

  return JSON.stringify([{ sheetName, headers, rows }]);
}

export function parseWorkbookBufferToPlainText(data: ArrayBuffer | Buffer, charLimit?: number): string {
  const workbook = read(data, { type: "buffer", sheetStubs: false });
  const sheetTexts: string[] = [];
  let totalLength = 0;
  // charLimit here is a soft parsing budget; downstream callers may still apply a hard final slice.
  const effectiveLimit = charLimit ? charLimit * 1.5 : 100_000;

  for (const sheetName of workbook.SheetNames) {
    if (totalLength >= effectiveLimit) {
      break;
    }

    const sheet = workbook.Sheets[sheetName];
    const csv = utils.sheet_to_csv(sheet);
    sheetTexts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
    totalLength += csv.length;
  }

  return sheetTexts.join("\n").trim();
}

export function parseGoogleSheetsFromRawContentToPlainText(snapshotRawContent: GoogleSheetsSpreadsheet): string {
  if (!snapshotRawContent.sheets) return "[]";

  const sheetsData: Array<{
    sheetName: string;
    headers: Array<{ column: string; header: string }>;
    rows: Array<{ column: string; row: number; value: string }>;
  }> = [];

  for (const sheet of snapshotRawContent.sheets) {
    if (!sheet.data || !sheet.properties?.title) continue;

    const sheetName = sheet.properties.title;
    const headers: Array<{ column: string; header: string }> = [];
    const rows: Array<{ column: string; row: number; value: string }> = [];

    // Helper to extract cell value
    const getCellValue = (cell: {
      formattedValue?: string;
      userEnteredValue?: { stringValue?: string; numberValue?: number; boolValue?: boolean };
    }): string => {
      if (cell.formattedValue) return cell.formattedValue;
      if (cell.userEnteredValue?.stringValue) return cell.userEnteredValue.stringValue;
      if (cell.userEnteredValue?.numberValue !== undefined) return cell.userEnteredValue.numberValue.toString();
      if (cell.userEnteredValue?.boolValue !== undefined) return cell.userEnteredValue.boolValue.toString();
      return "";
    };

    for (const gridData of sheet.data) {
      if (!gridData.rowData) continue;

      gridData.rowData.forEach((rowData, rowIndex) => {
        if (!rowData.values) return;

        rowData.values.forEach((cell, colIndex) => {
          const column = columnIndexToLetter(colIndex);
          const value = getCellValue(cell).trim();

          if (rowIndex === 0) {
            // Headers: keep all cells (including empty) to preserve column positions
            headers.push({ column, header: value });
          } else {
            // Rows: skip empty or whitespace-only cells
            if (!value) return;
            rows.push({ column, row: rowIndex + 1, value });
          }
        });
      });
    }

    if (headers.length > 0 || rows.length > 0) {
      sheetsData.push({ sheetName, headers, rows });
    }
  }

  return JSON.stringify(sheetsData);
}

export function parseGoogleSlidesFromRawContentToPlainText(snapshotRawContent: GoogleSlidesPresentation): string {
  if (!snapshotRawContent.slides) return "";

  const slideContents: string[] = [];

  // Helper function to extract text from textElements
  const extractTextFromElements = (textElements?: Array<{ textRun?: { content?: string } }>): string[] => {
    if (!textElements) return [];
    return textElements.map(el => el.textRun?.content?.trim()).filter((content): content is string => Boolean(content));
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

export const GDRIVE_BASE_URL = "https://www.googleapis.com/drive/v3/files/";

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
      const safeCause = docsError instanceof Error ? { message: docsError.message } : docsError;
      throw new Error("Request timed out using Google Docs API", { cause: safeCause });
    } else {
      console.error("Error using Google Docs API:", docsError instanceof Error ? docsError.message : String(docsError));

      // Check if it's a 404 or permission error - don't retry these
      if (docsError && typeof docsError === "object" && "status" in docsError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (docsError as any).status;
        if (status === 404 || status === 403) {
          const safeCause = docsError instanceof Error ? { message: docsError.message } : docsError;
          throw new Error(`File not accessible (${status}): ${fileId}`, { cause: safeCause });
        }
      }

      try {
        // Fallback to Drive API export if Docs API fails
        const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
        const exportRes = await axiosClient.get(exportUrl, {
          headers: { Authorization: `Bearer ${authToken}` },
          responseType: "text",
        });
        return exportRes.data;
      } catch {
        throw new Error(`Unable to access document content: ${fileId}`);
      }
    }
  }
}

export async function getGoogleSheetContent(
  fileId: string,
  authToken: string,
  axiosClient: AxiosInstance,
  sharedDriveParams: string,
): Promise<string> {
  // Prefer XLSX export so native Google Sheets follow the same workbook parsing path as uploaded Excel files.
  try {
    const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    const exportRes = await axiosClient.get(exportUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: "arraybuffer",
    });
    return parseWorkbookBufferToPlainText(exportRes.data);
  } catch (exportError) {
      if (exportError && typeof exportError === "object" && "status" in exportError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (exportError as any).status;
      if (status === 404 || status === 403) {
        const safeCause = exportError instanceof Error ? { message: exportError.message } : exportError;
        throw new Error(`Spreadsheet not accessible (${status}): ${fileId}`, { cause: safeCause });
      }
    }

    // If XLSX export fails, fall back to the prior CSV-first behavior.
    try {
      const csvExportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/csv`;
      const csvExportRes = await axiosClient.get(csvExportUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: "text",
      });
      const cleanedCsv = csvExportRes.data
        .split("\n")
        .map((line: string) => line.replace(/,+$/, ""))
        .map((line: string) => line.replace(/,{2,}/g, ","))
        .join("\n");
      return parseCSVToSheetJson(cleanedCsv);
    } catch {
      try {
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=true`;
        const sheetsRes = await axiosClient.get(sheetsUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        return parseGoogleSheetsFromRawContentToPlainText(sheetsRes.data);
      } catch (sheetsError) {
        const safeCauseSheets = sheetsError instanceof Error ? { message: sheetsError.message } : sheetsError;
        if (isAxiosTimeoutError(sheetsError)) {
          throw new Error("Request timed out using Google Sheets API", { cause: safeCauseSheets });
        }
        throw new Error(`Unable to access spreadsheet content: ${fileId}`, { cause: safeCauseSheets });
      }
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
      const safeCause = slidesError instanceof Error ? { message: slidesError.message } : slidesError;
      throw new Error("Request timed out using Google Slides API", { cause: safeCause });
    } else {
      console.error("Error using Google Slides API:", slidesError instanceof Error ? slidesError.message : String(slidesError));
      const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
      const exportRes = await axiosClient.get(exportUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: "text",
      });
      return exportRes.data;
    }
  }
}

/**
 * Parses a DOCX buffer to extract comments and their anchors from OpenXML.
 */
export interface DocxComment {
  id: string;
  author: string;
  date: string;
  text: string;
  anchoredText?: string;
  inlineObjects?: Array<{
    type: "image";
    title?: string;
    altText?: string;
    position: "inside_anchor";
  }>;
  documentPosition?: number; // Position in document flow (0-indexed)
  parentId?: string; // For threaded replies if found in OOXML extensions
  paraId?: string; // Paragraph ID used for mapping threaded replies
  resolved?: boolean; // True when w15:done="1" in commentsExtensible.xml
}

export async function readDocComments(
  buffer: ArrayBuffer | Buffer,
  includeReplies: boolean = false,
): Promise<DocxComment[]> {
  const zip = await JSZip.loadAsync(buffer);

  const commentsXml = await zip.file("word/comments.xml")?.async("string");
  if (!commentsXml) return [];

  const documentXml = await zip.file("word/document.xml")?.async("string");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: true,
    trimValues: false,
    processEntities: false,
    parseTagValue: false,
  });
  const parsedComments = parser.parse(commentsXml);

  const docxCommentsList: DocxComment[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractTextFromOrderedNodes(nodes: any, collectText = false, depth = 0): string {
    if (depth > 50) {
      throw new Error("Max XML nesting depth exceeded");
    }
    if (nodes == null) return "";
    if (Array.isArray(nodes))
      return nodes.map(node => extractTextFromOrderedNodes(node, collectText, depth + 1)).join("");
    if (typeof nodes !== "object") return String(nodes);

    let text = "";
    const keys = Object.keys(nodes);
    for (const key of keys) {
      if (key === "#text") {
        text += collectText ? extractTextFromOrderedNodes(nodes[key], collectText, depth + 1) : "";
      } else if (key === "w:t") {
        text += extractTextFromOrderedNodes(nodes[key], true, depth + 1);
      } else if (key !== ":@") {
        text += extractTextFromOrderedNodes(nodes[key], collectText, depth + 1);
      }
    }
    return text;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsRoot = parsedComments.find((node: any) => node["w:comments"])?.["w:comments"] || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsArr = commentsRoot.filter((node: any) => node["w:comment"]);

  for (const c of commentsArr) {
    const attrs = c[":@"] || {};
    const commentNodes = Array.isArray(c["w:comment"]) ? c["w:comment"] : [];
    const paragraphs = commentNodes.filter((node: Record<string, unknown>) => node["w:p"]);
    let text = "";
    let paraId: string | undefined = undefined;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      if (i > 0) text += "\n";
      if (!paraId && p[":@"]?.["@_w14:paraId"]) {
        paraId = p[":@"]["@_w14:paraId"];
      }
      text += extractTextFromOrderedNodes(p["w:p"]);
    }

    docxCommentsList.push({
      id: attrs["@_w:id"],
      paraId: paraId,
      author: attrs["@_w:author"] || "",
      date: attrs["@_w:date"] || "",
      text: text.trim(),
    });
  }

  // Parse replies and extension properties if extensible XML is present
  const commentsExtensibleXml = await zip.file("word/commentsExtensible.xml")?.async("string");
  if (commentsExtensibleXml) {
    try {
      const extParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: false });
      const parsedExt = extParser.parse(commentsExtensibleXml);
      // Look for w15:commentEx -> w15:parentId and w15:done
      if (parsedExt["w15:commentsEx"] && parsedExt["w15:commentsEx"]["w15:commentEx"]) {
        let exArr = parsedExt["w15:commentsEx"]["w15:commentEx"];
        if (!Array.isArray(exArr)) exArr = [exArr];

        for (const ex of exArr) {
          const paraId = ex["@_w15:paraId"];
          const paraIdParent = ex["@_w15:paraIdParent"];
          const done = ex["@_w15:done"];
          if (includeReplies && paraId && paraIdParent) {
            const comment = docxCommentsList.find(c => c.paraId === paraId);
            const parentComment = docxCommentsList.find(c => c.paraId === paraIdParent);
            if (comment && parentComment) {
              comment.parentId = parentComment.id;
            }
          }
          if (paraId && done === "1") {
            const comment = docxCommentsList.find(c => c.paraId === paraId);
            if (comment) {
              comment.resolved = true;
            }
          }
        }
      }
    } catch (e) {
      console.error("Error parsing commentsExtensible.xml", e);
    }
  }

  const headerXmls = await Promise.all(
    Object.keys(zip.files)
      .filter(path => /^word\/header\d+\.xml$/u.test(path))
      .sort((a, b) => parseInt(a.match(/\d+/)![0], 10) - parseInt(b.match(/\d+/)![0], 10))
      .map(path => zip.file(path)?.async("string")),
  );
  const footerXmls = await Promise.all(
    Object.keys(zip.files)
      .filter(path => /^word\/footer\d+\.xml$/u.test(path))
      .sort((a, b) => parseInt(a.match(/\d+/)![0], 10) - parseInt(b.match(/\d+/)![0], 10))
      .map(path => zip.file(path)?.async("string")),
  );
  const documentParts = [...headerXmls, documentXml, ...footerXmls].filter((xml): xml is string => !!xml);

  if (documentParts.length > 0) {
    const orderedParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      preserveOrder: true,
      trimValues: false,
      processEntities: false,
      parseTagValue: false,
    });

    const anchors: Record<
      string,
      {
        text: string;
        position: number;
        inlineObjects: NonNullable<DocxComment["inlineObjects"]>;
      }
    > = {};
    let currentPosition = 0;
    const activeIds = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function appendTextToActiveAnchors(text: any) {
      if (typeof text !== "string" || activeIds.size === 0) return;

      for (const id of activeIds) {
        anchors[id].text += text;
      }
    }

    function ensureAnchor(id: string) {
      if (!anchors[id]) anchors[id] = { text: "", position: currentPosition++, inlineObjects: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function extractTextFromTextNode(node: any, depth = 0): string {
      if (depth > 50) {
        throw new Error("Max XML nesting depth exceeded");
      }
      if (typeof node === "string") return node;
      if (!node) return "";

      let text = "";
      if (Array.isArray(node)) {
        for (const child of node) text += extractTextFromTextNode(child, depth + 1);
      } else if (typeof node === "object") {
        if (typeof node["#text"] === "string") text += node["#text"];
        const keys = Object.keys(node);
        for (const key of keys) {
          if (key === "#text" || key.startsWith(":@")) continue;
          text += extractTextFromTextNode(node[key], depth + 1);
        }
      }

      return text;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function findDrawingDocProperties(nodes: any): Array<{ title?: string; altText?: string }> {
      const properties: Array<{ title?: string; altText?: string }> = [];

      function traverseDrawingNode(current: unknown, depth = 0) {
        if (depth > 50) {
          throw new Error("Max XML nesting depth exceeded");
        }
        if (!current) return;
        if (Array.isArray(current)) {
          for (const child of current) traverseDrawingNode(child, depth + 1);
          return;
        }

        if (typeof current !== "object") return;

        const currentNode = current as Record<string, unknown>;
        const keys = Object.keys(currentNode);
        for (const key of keys) {
          if (key === "wp:docPr" || key === "pic:cNvPr") {
            const attrs = (currentNode[":@"] || {}) as Record<string, unknown>;
            const title = attrs["@_title"] || attrs["@_name"];
            const altText = attrs["@_descr"];
            if (typeof title === "string" || typeof altText === "string") {
              properties.push({
                title: typeof title === "string" ? title : undefined,
                altText: typeof altText === "string" ? altText : undefined,
              });
            }
          } else if (!key.startsWith(":@")) {
            traverseDrawingNode(currentNode[key], depth + 1);
          }
        }
      }

      traverseDrawingNode(nodes);
      return properties;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function appendInlineImageMetadataToActiveAnchors(nodes: any) {
      if (activeIds.size === 0) return;

      const imageProperties = findDrawingDocProperties(nodes);
      if (imageProperties.length === 0) return;

      for (const id of activeIds) {
        for (const image of imageProperties) {
          anchors[id].inlineObjects.push({
            type: "image",
            position: "inside_anchor",
            ...image,
          });
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverseDoc(nodes: any, depth = 0) {
      if (depth > 50) {
        throw new Error("Max XML nesting depth exceeded");
      }
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        const keys = Object.keys(node);
        for (const key of keys) {
          if (key.startsWith(":@")) continue;

          if (key === "w:p") {
            traverseDoc(node[key], depth + 1);
            appendTextToActiveAnchors("\n");
          } else if (key === "w:commentRangeStart") {
            const id = node[":@"]?.["@_w:id"];
            if (id) {
              activeIds.add(id);
              ensureAnchor(id);
            }
          } else if (key === "w:commentRangeEnd") {
            const id = node[":@"]?.["@_w:id"];
            if (id) activeIds.delete(id);
          } else if (key === "w:t") {
            appendTextToActiveAnchors(extractTextFromTextNode(node[key], depth + 1));
          } else if (key === "w:drawing" || key === "w:pict") {
            appendInlineImageMetadataToActiveAnchors(node[key]);
          } else if (key === "w:tab") {
            appendTextToActiveAnchors("\t");
          } else if (key === "w:br" || key === "w:cr") {
            appendTextToActiveAnchors("\n");
          } else {
            traverseDoc(node[key], depth + 1);
          }
        }
      }
    }

    for (const xml of documentParts) {
      traverseDoc(orderedParser.parse(xml));
    }

    for (const c of docxCommentsList) {
      if (anchors[c.id]) {
        c.anchoredText = anchors[c.id].text.replace(/\n+$/u, "");
        c.inlineObjects = anchors[c.id].inlineObjects;
        c.documentPosition = anchors[c.id].position;
      }
    }
  }

  return docxCommentsList;
}

/**
 * Deterministically joins Drive comments to DOCX OpenXML comments to attach the precise anchor.
 * Exact match required on: Author Name, Truncated Date, and Text Content.
 * Uses an O(n+m) index keyed on author|seconds|text instead of O(n×m) linear search.
 */
export interface DriveCommentForMatching {
  content?: string;
  createdTime: string;
  anchoredText?: string;
  author?: { displayName?: string };
}

export function matchDocxCommentsToDriveComments<T extends DriveCommentForMatching>(
  driveComments: T[],
  docxComments: DocxComment[],
) {
  // Count frequency of each key in driveComments to ensure uniqueness
  const driveCounts = new Map<string, number>();
  for (const dc of driveComments) {
    const dcAuthor = dc.author?.displayName || "";
    const dcText = (dc.content || "").trim();
    let seconds = Math.floor(new Date(dc.createdTime).getTime() / 1000);
    if (isNaN(seconds)) seconds = 0;
    const key = JSON.stringify([dcAuthor, seconds, dcText]);
    driveCounts.set(key, (driveCounts.get(key) || 0) + 1);
  }

  // Build an index keyed on author|truncatedSeconds|text for O(n+m) matching
  const docxIndex = new Map<string, DocxComment[]>();
  for (const xc of docxComments) {
    let seconds = Math.floor(new Date(xc.date).getTime() / 1000);
    if (isNaN(seconds)) seconds = 0;
    const key = JSON.stringify([xc.author, seconds, xc.text]);
    const matches = docxIndex.get(key) || [];
    matches.push(xc);
    docxIndex.set(key, matches);
  }

  return driveComments.map(dc => {
    const dcAuthor = dc.author?.displayName || "";
    const dcText = (dc.content || "").trim();
    let seconds = Math.floor(new Date(dc.createdTime).getTime() / 1000);
    if (isNaN(seconds)) seconds = 0;
    const key = JSON.stringify([dcAuthor, seconds, dcText]);

    const docxMatches = docxIndex.get(key) || [];
    const driveCount = driveCounts.get(key) || 0;

    // Only match if the key is unique in both driveComments and docxComments
    const match = docxMatches.length === 1 && driveCount === 1 ? docxMatches[0] : undefined;

    return {
      ...dc,
      docxCommentId: match ? match.id : undefined,
      documentPosition: match?.documentPosition,
      anchoredText: match?.anchoredText || dc.anchoredText || undefined,
      inlineObjects: match?.inlineObjects,
      anchorConfidence: (match?.anchoredText ? "exact" : "none") as "exact" | "none",
    };
  });
}
