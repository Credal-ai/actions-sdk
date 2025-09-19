import { extractText } from "unpdf";

export async function extractTextFromPdf(input: ArrayBuffer | Uint8Array): Promise<string> {
  // Normalize input into Uint8Array
  const data: Uint8Array =
    input instanceof Uint8Array && !(typeof Buffer !== "undefined" && Buffer.isBuffer(input))
      ? input
      : typeof Buffer !== "undefined" && Buffer.isBuffer(input)
        ? new Uint8Array(input)
        : new Uint8Array(input);

  // Extract text using unpdf
  const { text } = await extractText(data);

  return text.map(page => page.trim()).join("\n\n");
}
