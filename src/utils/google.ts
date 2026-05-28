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
      throw new Error("Request timed out using Google Docs API", { cause: docsError });
    } else {
      console.log("Error using Google Docs API", docsError);

      // Check if it's a 404 or permission error - don't retry these
      if (docsError && typeof docsError === "object" && "status" in docsError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (docsError as any).status;
        if (status === 404 || status === 403) {
          throw new Error(`File not accessible (${status}): ${fileId}`, { cause: docsError });
        }
      }

      try {
        // Fallback to Drive API export if Docs API fails
        const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/plain${sharedDriveParams}`;
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
    const exportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet${sharedDriveParams}`;
    const exportRes = await axiosClient.get(exportUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: "arraybuffer",
    });
    return parseWorkbookBufferToPlainText(exportRes.data);
  } catch (exportError) {
    // Check if it's a 404 or permission error
    if (exportError && typeof exportError === "object" && "status" in exportError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (exportError as any).status;
      if (status === 404 || status === 403) {
        throw new Error(`Spreadsheet not accessible (${status}): ${fileId}`, { cause: exportError });
      }
    }

    // If XLSX export fails, fall back to the prior CSV-first behavior.
    try {
      const csvExportUrl = `${GDRIVE_BASE_URL}${encodeURIComponent(fileId)}/export?mimeType=text/csv${sharedDriveParams}`;
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
        if (isAxiosTimeoutError(sheetsError)) {
          throw new Error("Request timed out using Google Sheets API", { cause: sheetsError });
        }
        throw new Error(`Unable to access spreadsheet content: ${fileId}`, { cause: sheetsError });
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
      throw new Error("Request timed out using Google Slides API", { cause: slidesError });
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
}

export async function readDocComments(
  buffer: ArrayBuffer | Buffer,
  includeReplies: boolean = false,
): Promise<DocxComment[]> {
  const zip = await JSZip.loadAsync(buffer);

  const commentsXml = await zip.file("word/comments.xml")?.async("string");
  if (!commentsXml) return [];

  const documentXml = await zip.file("word/document.xml")?.async("string");

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsedComments = parser.parse(commentsXml);

  const docxCommentsList: DocxComment[] = [];
  if (parsedComments["w:comments"] && parsedComments["w:comments"]["w:comment"]) {
    let commentsArr = parsedComments["w:comments"]["w:comment"];
    if (!Array.isArray(commentsArr)) commentsArr = [commentsArr];

    for (const c of commentsArr) {
      let text = "";
      if (c["w:p"]) {
        const ps = Array.isArray(c["w:p"]) ? c["w:p"] : [c["w:p"]];
        for (const p of ps) {
          if (p["w:r"]) {
            const rs = Array.isArray(p["w:r"]) ? p["w:r"] : [p["w:r"]];
            for (const r of rs) {
              if (r["w:t"]) {
                const t = r["w:t"];
                text += typeof t === "string" ? t : t["#text"] || "";
              }
            }
          }
        }
      }
      docxCommentsList.push({
        id: c["@_w:id"],
        author: c["@_w:author"] || "",
        date: c["@_w:date"] || "",
        text: text.trim(),
      });
    }
  }

  // Parse replies if requested (for native DOCX files)
  if (includeReplies) {
    const commentsExtensibleXml = await zip.file("word/commentsExtensible.xml")?.async("string");
    if (commentsExtensibleXml) {
      try {
        const extParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const parsedExt = extParser.parse(commentsExtensibleXml);
        // Look for w15:commentEx -> w15:parentId
        if (parsedExt["w15:commentsEx"] && parsedExt["w15:commentsEx"]["w15:commentEx"]) {
          let exArr = parsedExt["w15:commentsEx"]["w15:commentEx"];
          if (!Array.isArray(exArr)) exArr = [exArr];
          for (const ex of exArr) {
            const id = ex["@_w15:paraIdParent"] || ex["@_w15:paraId"] || ex["@_w15:id"];
            const parentId = ex["@_w15:parentId"];
            if (id && parentId) {
              const comment = docxCommentsList.find(c => c.id === id);
              if (comment) {
                comment.parentId = parentId;
              }
            }
          }
        }
      } catch (e) {
        console.error("Error parsing commentsExtensible.xml", e);
      }
    }
  }

  const headerXmls = await Promise.all(
    Object.keys(zip.files)
      .filter(path => /^word\/header\d+\.xml$/u.test(path))
      .sort()
      .map(path => zip.file(path)?.async("string")),
  );
  const footerXmls = await Promise.all(
    Object.keys(zip.files)
      .filter(path => /^word\/footer\d+\.xml$/u.test(path))
      .sort()
      .map(path => zip.file(path)?.async("string")),
  );
  const documentParts = [documentXml, ...headerXmls, ...footerXmls].filter((xml): xml is string => !!xml);

  if (documentParts.length > 0) {
    const orderedParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      preserveOrder: true,
      trimValues: false,
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
    function extractTextFromTextNode(node: any): string {
      if (typeof node === "string") return node;
      if (!node) return "";

      let text = "";
      if (Array.isArray(node)) {
        for (const child of node) text += extractTextFromTextNode(child);
      } else if (typeof node === "object") {
        if (typeof node["#text"] === "string") text += node["#text"];
        for (const key in node) {
          if (key === "#text" || key.startsWith(":@")) continue;
          text += extractTextFromTextNode(node[key]);
        }
      }

      return text;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function findDrawingDocProperties(nodes: any): Array<{ title?: string; altText?: string }> {
      const properties: Array<{ title?: string; altText?: string }> = [];

      function traverseDrawingNode(current: unknown) {
        if (!current) return;
        if (Array.isArray(current)) {
          for (const child of current) traverseDrawingNode(child);
          return;
        }

        if (typeof current !== "object") return;

        const currentNode = current as Record<string, unknown>;
        for (const key in currentNode) {
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
            traverseDrawingNode(currentNode[key]);
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
    function traverseDoc(nodes: any) {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        for (const key in node) {
          if (key.startsWith(":@")) continue;

          if (key === "w:p") {
            traverseDoc(node[key]);
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
            appendTextToActiveAnchors(extractTextFromTextNode(node[key]));
          } else if (key === "w:drawing" || key === "w:pict") {
            appendInlineImageMetadataToActiveAnchors(node[key]);
          } else if (key === "w:tab") {
            appendTextToActiveAnchors("\t");
          } else if (key === "w:br" || key === "w:cr") {
            appendTextToActiveAnchors("\n");
          } else {
            traverseDoc(node[key]);
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function matchDocxCommentsToDriveComments(driveComments: any[], docxComments: DocxComment[]): any[] {
  return driveComments.map(dc => {
    const dcAuthor = dc.author?.displayName || "";
    const dcText = (dc.content || "").trim();

    const match = docxComments.find(xc => {
      const authorMatch = xc.author === dcAuthor;
      // DOCX exports truncate Drive milliseconds down to the exact second
      const docxSeconds = Math.floor(new Date(xc.date).getTime() / 1000);
      const driveSeconds = Math.floor(new Date(dc.createdTime).getTime() / 1000);
      const dateMatch = docxSeconds === driveSeconds;
      const contentMatch = xc.text === dcText;
      return authorMatch && dateMatch && contentMatch;
    });

    return {
      ...dc,
      docxCommentId: match ? match.id : undefined,
      documentPosition: match?.documentPosition,
      anchoredText: match?.anchoredText || dc.anchoredText || undefined,
      inlineObjects: match?.inlineObjects,
      anchorConfidence: match?.anchoredText ? "exact" : "none",
    };
  });
}
