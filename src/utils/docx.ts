import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

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

  async function safeReadZipString(path: string): Promise<string | undefined> {
    const fileObj = zip.file(path);
    if (!fileObj) return undefined;

    return new Promise((resolve, reject) => {
      let totalBytes = 0;
      const chunks: Buffer[] = [];
      
      // Use Node.js streaming to physically count bytes during decompression
      // This protects against forged headers in Zip Bomb attacks.
      const stream = fileObj.nodeStream();

      stream.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > 20 * 1024 * 1024) {
          // Instantly sever the stream if it crosses the 20MB threshold
          if (typeof (stream as any).destroy === "function") {
            (stream as any).destroy();
          } else if (typeof (stream as any).pause === "function") {
            (stream as any).pause();
          }
          reject(new Error(`File ${path} exceeds the 20 MB decompression safety limit.`));
        } else {
          chunks.push(chunk);
        }
      });

      stream.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf-8"));
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
  }

  const commentsXml = await safeReadZipString("word/comments.xml");
  if (!commentsXml) return [];

  const documentXml = await safeReadZipString("word/document.xml");

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
  const commentsRootRaw = parsedComments.find((node: any) => node["w:comments"])?.["w:comments"];
  const commentsRoot = Array.isArray(commentsRootRaw) ? commentsRootRaw : [];
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
  const commentsExtensibleXml = await safeReadZipString("word/commentsExtensible.xml");
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
      .map(path => safeReadZipString(path)),
  );
  const footerXmls = await Promise.all(
    Object.keys(zip.files)
      .filter(path => /^word\/footer\d+\.xml$/u.test(path))
      .sort((a, b) => parseInt(a.match(/\d+/)![0], 10) - parseInt(b.match(/\d+/)![0], 10))
      .map(path => safeReadZipString(path)),
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
    > = Object.create(null);
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
          if (key === "wp:docPr") {
            // wp:docPr is the authoritative drawing properties element; capture it and stop.
            const attrs = (currentNode[":@"] || {}) as Record<string, unknown>;
            const title = attrs["@_title"] || attrs["@_name"];
            const altText = attrs["@_descr"];
            if (typeof title === "string" || typeof altText === "string") {
              properties.push({
                title: typeof title === "string" ? title : undefined,
                altText: typeof altText === "string" ? altText : undefined,
              });
            }
            // Do not recurse further — pic:cNvPr below carries the same metadata.
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
