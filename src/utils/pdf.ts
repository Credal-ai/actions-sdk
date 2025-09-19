import DOMMatrix from "@thednp/dommatrix";

// Set global DOMMatrix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.DOMMatrix = DOMMatrix as any;

export async function extractTextFromPdf(input: ArrayBuffer | Uint8Array): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Convert Buffer or ArrayBuffer -> plain Uint8Array
  const data: Uint8Array =
    input instanceof Uint8Array && !(typeof Buffer !== "undefined" && Buffer.isBuffer(input))
      ? input
      : typeof Buffer !== "undefined" && Buffer.isBuffer(input)
        ? new Uint8Array(input) // copies bytes out of the Buffer
        : new Uint8Array(input); // ArrayBuffer case

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
