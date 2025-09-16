import PDFParser from "pdf2json";

// Define proper types for the PDF data structure
interface PDFTextRun {
  T: string;
  S?: number;
  TS?: number[];
}

interface PDFText {
  R: PDFTextRun[];
  x: number;
  y: number;
}

interface PDFPage {
  Texts: PDFText[];
  Width: number;
  Height: number;
}

interface PDFData {
  Pages: PDFPage[];
  Meta: Record<string, unknown>;
}

// Correct type based on the library's actual interface
interface PDFParserError {
  parserError: Error;
}

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const extractedText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: PDFParserError) => {
        reject(errData.parserError || new Error("PDF parsing failed"));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: PDFData) => {
        try {
          const text = pdfData.Pages.map((page: PDFPage) =>
            page.Texts.map((textItem: PDFText) => {
              // Handle cases where R array might be empty or have multiple runs
              return textItem.R.map((run: PDFTextRun) => decodeURIComponent(run.T)).join("");
            }).join(""),
          ).join("\n");
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });

      pdfParser.parseBuffer(Buffer.from(buffer));
    });
    return extractedText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw error;
  }
}
