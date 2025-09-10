import pdf from "pdf-parse";

function toNodeBuffer(input: ArrayBuffer | Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  return Buffer.from(new Uint8Array(input));
}

export async function extractTextFromPdf(buffer: ArrayBuffer | Uint8Array | Buffer): Promise<string> {
  const nodeBuf = toNodeBuffer(buffer);
  const { text } = await pdf(nodeBuf);
  // pdf-parse separates pages with form feed (\f)
  return text.split("\f").map(page => page.trim()).join("\n\n");
}