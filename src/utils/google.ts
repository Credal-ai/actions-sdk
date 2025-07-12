
import type { docs_v1, sheets_v4, slides_v1 } from "googleapis";

type DocSection = {
  heading:
    | { id: string; type: string; }
    | undefined;
  paragraphs: string[];
};

// Helper function to parse Google Docs content to plain text
export function parseGoogleDocFromRawContentToPlainText(snapshotRawContent: docs_v1.Schema$Document): string {
  const docSections: DocSection[] = [
    {
      heading: undefined,
      paragraphs: [],
    },
  ];
  
  if (!snapshotRawContent.body?.content) return "";
  
  for (const content of snapshotRawContent.body.content) {
    if (!content) continue;
    const { paragraph } = content;
    // Not a text paragraph
    if (!paragraph) continue;

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

    if (!paragraph?.elements) continue;
    
    const combinedTextRuns = paragraph.elements
      .map(element => element.textRun?.content)
      .filter((content): content is string => Boolean(content))
      .join("");

    const bulletNestingLevel = paragraph.bullet === undefined ? undefined : (paragraph.bullet?.nestingLevel ?? 0);
    const paragraphContent =
      bulletNestingLevel === undefined ? combinedTextRuns : "\t".repeat(bulletNestingLevel) + " • " + combinedTextRuns;
    
    docSections[docSections.length - 1]!.paragraphs.push(paragraphContent);
  }

  const validDocSections = docSections.filter(section => section.heading || section.paragraphs.length > 0);
  return validDocSections.map(heading => heading.paragraphs.join(" ")).join("\n");
}

export function parseGoogleSheetsFromRawContentToPlainText(snapshotRawContent: sheets_v4.Schema$Spreadsheet): string {
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

export function parseGoogleSlidesFromRawContentToPlainText(snapshotRawContent: slides_v1.Schema$Presentation): string {
  if (!snapshotRawContent.slides) return "";
  
  const slideContents: string[] = [];
  
  for (const slide of snapshotRawContent.slides) {
    if (!slide.pageElements) continue;
    
    const slideTexts: string[] = [];
    
    for (const pageElement of slide.pageElements) {
      if (!pageElement.shape?.text?.textElements) continue;
      
      for (const textElement of pageElement.shape.text.textElements) {
        if (textElement.textRun?.content) {
          slideTexts.push(textElement.textRun.content.trim());
        }
      }
    }
    
    if (slideTexts.length > 0) {
      slideContents.push(slideTexts.join(" "));
    }
  }
  
  return slideContents.join("\n\n");
}
