// npm i pdfjs-dist
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractTextFromPdf(input: ArrayBuffer | Uint8Array): Promise<string> {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input);

  // Load PDF
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // content.items is typed as TextItem | TextMarkedContent
    const strings = content.items.map(item => ("str" in item ? item.str : "")).join(" ");

    pages.push(strings.trim());
  }

  await pdf.destroy();
  return pages.join("\n\n");
}
