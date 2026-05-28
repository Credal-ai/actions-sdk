import { describe, expect, it } from "@jest/globals";
import JSZip from "jszip";
import {
  matchDocxCommentsToDriveComments,
  readDocComments,
} from "../../src/utils/google";

function textRun(text: string) {
  return `<w:r><w:t>${text}</w:t></w:r>`;
}

function preservedTextRun(text: string) {
  return `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
}

async function buildDocxWithComments() {
  const zip = new JSZip();

  zip.file(
    "word/comments.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:comment w:id="0" w:author="Matthew Betancourt" w:date="2026-05-28T02:20:13Z">
        <w:p>${textRun("Comment #1 that only highlights one word")}</w:p>
      </w:comment>
      <w:comment w:id="1" w:author="Matthew Betancourt" w:date="2026-05-28T02:20:37Z">
        <w:p>${textRun("Comment #2 of the same exact word!")}</w:p>
      </w:comment>
      <w:comment w:id="2" w:author="Matthew Betancourt" w:date="2026-05-28T02:13:29Z">
        <w:p>${textRun("The highlighted text of this comment may or may not involve two separate paragraphs!")}</w:p>
      </w:comment>
      <w:comment w:id="3" w:author="Matthew Betancourt" w:date="2026-05-28T02:19:47Z">
        <w:p>${textRun("how do we handle highlighted comment text that contains a hyperlink???")}</w:p>
      </w:comment>
      <w:comment w:id="4" w:author="Matthew Betancourt" w:date="2026-05-28T02:18:33Z">
        <w:p>${textRun("highlighted text within highlighted text edge case!")}</w:p>
      </w:comment>
      <w:comment w:id="5" w:author="Matthew Betancourt" w:date="2026-05-28T02:43:38Z">
        <w:p>${textRun("inline image example! This cat may or may not be social.")}</w:p>
      </w:comment>
      <w:comment w:id="6" w:author="Matthew Betancourt" w:date="2026-05-28T02:59:42Z">
        <w:p>${textRun("this comment highlights a single random space in the document")}</w:p>
      </w:comment>
      <w:comment w:id="7" w:author="Matthew Betancourt" w:date="2026-05-28T03:18:33Z">
        <w:p>${textRun("commenting on this because it contains mixed styles")}</w:p>
      </w:comment>
      <w:comment w:id="8" w:author="Matthew Betancourt" w:date="2026-05-28T03:29:51Z">
        <w:p>${textRun("smart chip comment #1")}</w:p>
      </w:comment>
      <w:comment w:id="9" w:author="Matthew Betancourt" w:date="2026-05-28T03:30:05Z">
        <w:p>${textRun("smart chip comment #2")}</w:p>
      </w:comment>
      <w:comment w:id="10" w:author="Matthew Betancourt" w:date="2026-05-28T03:31:19Z">
        <w:p>${textRun("this is the very last character of the doc")}</w:p>
      </w:comment>
      <w:comment w:id="11" w:author="Matthew Betancourt" w:date="2026-05-28T03:33:17Z">
        <w:p>${textRun("Comment associated with header")}</w:p>
      </w:comment>
      <w:comment w:id="12" w:author="Matthew Betancourt" w:date="2026-05-28T03:33:51Z">
        <w:p>${textRun("This comment is associated with the footer")}</w:p>
      </w:comment>
      <w:comment w:id="13" w:author="Matthew Betancourt" w:date="2026-05-28T03:54:05Z">
        <w:p>${textRun("Both of these are Detroit Teams!")}</w:p>
      </w:comment>
      <w:comment w:id="14" w:author="Matthew Betancourt" w:date="2026-05-28T03:55:57Z">
        <w:p>${textRun("I have 3 of these")}</w:p>
      </w:comment>
      <w:comment w:id="15" w:author="Matthew Betancourt" w:date="2026-05-28T03:56:16Z">
        <w:p>${textRun("I used to live next to a bodega with one of these!")}</w:p>
      </w:comment>
      <w:comment w:id="16" w:author="Matthew Betancourt" w:date="2026-05-28T04:12:07Z">
        <w:p>${textRun("Comment on a tab that is not the first one")}</w:p>
      </w:comment>
    </w:comments>`,
  );

  zip.file(
    "word/header1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:p>
        <w:commentRangeStart w:id="11"/>
        ${textRun("Header content for comment testing")}
        <w:commentRangeEnd w:id="11"/>
      </w:p>
    </w:hdr>`,
  );

  zip.file(
    "word/footer1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:p>
        <w:commentRangeStart w:id="12"/>
        ${textRun("Footer for comment test")}
        <w:commentRangeEnd w:id="12"/>
      </w:p>
    </w:ftr>`,
  );

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document
      xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
      xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>
        <w:p>
          ${textRun("First ")}
          <w:commentRangeStart w:id="0"/>
          ${textRun("cats")}
          <w:commentRangeEnd w:id="0"/>
          ${textRun(" and second ")}
          <w:commentRangeStart w:id="1"/>
          ${textRun("cats")}
          <w:commentRangeEnd w:id="1"/>
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="2"/>
          ${textRun("Therefore, most experts recommend not placing kittens before 10 or 12 weeks of age (7)1.")}
        </w:p>
        <w:p>
          ${textRun("Although original socialization status to people is of paramount importance")}
          <w:commentRangeEnd w:id="2"/>
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="3"/>
          ${textRun("TurnerDC. Cat behaviour ")}
          <w:hyperlink r:id="rId5">${textRun("and the human/cat relationship")}</w:hyperlink>
          ${textRun(". Anim Fam.")}
          <w:commentRangeEnd w:id="3"/>
        </w:p>
        <w:p>
          ${textRun("Operationally, the ")}
          <w:commentRangeStart w:id="4"/>
          ${textRun("wish")}
          <w:commentRangeEnd w:id="4"/>
          ${textRun(" to interact was defined.")}
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="7"/>
          <w:r><w:t>Turner and </w:t></w:r>
          <w:r><w:rPr><w:b/></w:rPr><w:t>Stammbach-Geering</w:t></w:r>
          <w:r><w:t> (12) </w:t></w:r>
          <w:r><w:rPr><w:i/></w:rPr><w:t>asked women</w:t></w:r>
          <w:r><w:t> living at </w:t></w:r>
          <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>home</w:t></w:r>
          <w:r><w:t> to subjectively</w:t></w:r>
          <w:commentRangeEnd w:id="7"/>
        </w:p>
        <w:p>
          ${textRun("Single")}
          <w:commentRangeStart w:id="6"/>
          ${preservedTextRun(" ")}
          <w:commentRangeEnd w:id="6"/>
          ${textRun("space")}
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="5"/>
          ${textRun("For a cat well-socialized ")}
          <w:r><w:drawing><wp:inline><wp:extent cx="1" cy="1"/><wp:docPr id="1" name="Social cat walkthrough screenshot" title="Social cat title" descr="A screenshot showing a cat during a socialization walkthrough."/></wp:inline></w:drawing></w:r>
          ${textRun("to humans as a kitten")}
          <w:commentRangeEnd w:id="5"/>
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="8"/>
          ${textRun("and number ")}
          <w:sdt><w:sdtContent>${textRun("May 27, 2026")}</w:sdtContent></w:sdt>
          ${textRun(" of cats")}
          <w:commentRangeEnd w:id="8"/>
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="9"/>
          ${textRun("positive ")}
          <w:sdt><w:sdtContent>${textRun("Matthew Betancourt")}</w:sdtContent></w:sdt>
          <w:commentRangeEnd w:id="9"/>
        </w:p>
        <w:p>
          <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
          ${textRun("Tigers and ")}
          <w:commentRangeStart w:id="13"/>
          ${textRun("Lions")}
          <w:commentRangeEnd w:id="13"/>
        </w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p>${textRun("Breed")}</w:p></w:tc>
            <w:tc><w:p>${textRun("Comment")}</w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:commentRangeStart w:id="14"/>${textRun("American Shorthair")}<w:commentRangeEnd w:id="14"/></w:p></w:tc>
            <w:tc><w:p>${textRun("table cell comment")}</w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:commentRangeStart w:id="15"/>${textRun("Bombay")}<w:commentRangeEnd w:id="15"/></w:p></w:tc>
            <w:tc><w:p>${textRun("another table cell comment")}</w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:p>
          ${textRun("Final body sentence")}
          <w:commentRangeStart w:id="10"/>
          ${textRun(".")}
          <w:commentRangeEnd w:id="10"/>
        </w:p>
        <w:p>
          <w:commentRangeStart w:id="16"/>
          ${textRun("Tab # 2 Edge Case handling")}
          <w:commentRangeEnd w:id="16"/>
        </w:p>
      </w:body>
    </w:document>`,
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

describe("readDocComments", () => {
  it("extracts precise anchors for repeated text, hyperlinks, and multi-paragraph ranges", async () => {
    const docx = await buildDocxWithComments();

    const comments = await readDocComments(docx);

    expect(comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "11",
          anchoredText: "Header content for comment testing",
          documentPosition: 0,
        }),
        expect.objectContaining({
          id: "0",
          anchoredText: "cats",
          documentPosition: 1,
        }),
        expect.objectContaining({
          id: "1",
          anchoredText: "cats",
          documentPosition: 2,
        }),
        expect.objectContaining({
          id: "2",
          anchoredText:
            "Therefore, most experts recommend not placing kittens before 10 or 12 weeks of age (7)1.\nAlthough original socialization status to people is of paramount importance",
          documentPosition: 3,
        }),
        expect.objectContaining({
          id: "3",
          anchoredText:
            "TurnerDC. Cat behaviour and the human/cat relationship. Anim Fam.",
          documentPosition: 4,
        }),
        expect.objectContaining({
          id: "4",
          anchoredText: "wish",
          documentPosition: 5,
        }),
        expect.objectContaining({
          id: "7",
          anchoredText:
            "Turner and Stammbach-Geering (12) asked women living at home to subjectively",
          documentPosition: 6,
        }),
        expect.objectContaining({
          id: "6",
          anchoredText: " ",
          documentPosition: 7,
        }),
        expect.objectContaining({
          id: "5",
          anchoredText: "For a cat well-socialized to humans as a kitten",
          inlineObjects: [
            {
              type: "image",
              title: "Social cat title",
              altText:
                "A screenshot showing a cat during a socialization walkthrough.",
              position: "inside_anchor",
            },
          ],
          documentPosition: 8,
        }),
        expect.objectContaining({
          id: "8",
          anchoredText: "and number May 27, 2026 of cats",
          documentPosition: 9,
        }),
        expect.objectContaining({
          id: "9",
          anchoredText: "positive Matthew Betancourt",
          documentPosition: 10,
        }),
        expect.objectContaining({
          id: "13",
          anchoredText: "Lions",
          documentPosition: 11,
        }),
        expect.objectContaining({
          id: "14",
          anchoredText: "American Shorthair",
          documentPosition: 12,
        }),
        expect.objectContaining({
          id: "15",
          anchoredText: "Bombay",
          documentPosition: 13,
        }),
        expect.objectContaining({
          id: "10",
          anchoredText: ".",
          documentPosition: 14,
        }),
        expect.objectContaining({
          id: "16",
          anchoredText: "Tab # 2 Edge Case handling",
          documentPosition: 15,
        }),
        expect.objectContaining({
          id: "12",
          anchoredText: "Footer for comment test",
          documentPosition: 16,
        }),
      ]),
    );
  });
});

describe("matchDocxCommentsToDriveComments", () => {
  it("matches Drive comments to DOCX comments at second precision and preserves document order positions", async () => {
    const docxComments = await readDocComments(await buildDocxWithComments());
    const driveComments = [
      {
        commentId: "drive-1",
        content: "Comment #2 of the same exact word!",
        createdTime: "2026-05-28T02:20:37.597Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-0",
        content: "Comment #1 that only highlights one word",
        createdTime: "2026-05-28T02:20:13.982Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-7",
        content: "commenting on this because it contains mixed styles",
        createdTime: "2026-05-28T03:18:33.794Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-6",
        content:
          "this comment highlights a single random space in the document",
        createdTime: "2026-05-28T02:59:42.452Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-5",
        content: "inline image example! This cat may or may not be social.",
        createdTime: "2026-05-28T02:43:38.669Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-8",
        content: "smart chip comment #1",
        createdTime: "2026-05-28T03:29:51.360Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-9",
        content: "smart chip comment #2",
        createdTime: "2026-05-28T03:30:05.894Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-10",
        content: "this is the very last character of the doc",
        createdTime: "2026-05-28T03:31:19.774Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-13",
        content: "Both of these are Detroit Teams!",
        createdTime: "2026-05-28T03:54:05.354Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-14",
        content: "I have 3 of these",
        createdTime: "2026-05-28T03:55:57.486Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-15",
        content: "I used to live next to a bodega with one of these!",
        createdTime: "2026-05-28T03:56:16.210Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-16",
        content: "Comment on a tab that is not the first one",
        createdTime: "2026-05-28T04:12:07.973Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-11",
        content: "Comment associated with header",
        createdTime: "2026-05-28T03:33:17.015Z",
        author: { displayName: "Matthew Betancourt" },
      },
      {
        commentId: "drive-12",
        content: "This comment is associated with the footer",
        createdTime: "2026-05-28T03:33:51.837Z",
        author: { displayName: "Matthew Betancourt" },
      },
    ];

    const matched = matchDocxCommentsToDriveComments(
      driveComments,
      docxComments,
    );

    expect(matched).toEqual([
      expect.objectContaining({
        commentId: "drive-1",
        docxCommentId: "1",
        anchoredText: "cats",
        anchorConfidence: "exact",
        documentPosition: 2,
      }),
      expect.objectContaining({
        commentId: "drive-0",
        docxCommentId: "0",
        anchoredText: "cats",
        anchorConfidence: "exact",
        documentPosition: 1,
      }),
      expect.objectContaining({
        commentId: "drive-7",
        docxCommentId: "7",
        anchoredText:
          "Turner and Stammbach-Geering (12) asked women living at home to subjectively",
        anchorConfidence: "exact",
        documentPosition: 6,
      }),
      expect.objectContaining({
        commentId: "drive-6",
        docxCommentId: "6",
        anchoredText: " ",
        anchorConfidence: "exact",
        documentPosition: 7,
      }),
      expect.objectContaining({
        commentId: "drive-5",
        docxCommentId: "5",
        inlineObjects: [
          {
            type: "image",
            title: "Social cat title",
            altText:
              "A screenshot showing a cat during a socialization walkthrough.",
            position: "inside_anchor",
          },
        ],
        anchorConfidence: "exact",
        documentPosition: 8,
      }),
      expect.objectContaining({
        commentId: "drive-8",
        docxCommentId: "8",
        anchoredText: "and number May 27, 2026 of cats",
        anchorConfidence: "exact",
        documentPosition: 9,
      }),
      expect.objectContaining({
        commentId: "drive-9",
        docxCommentId: "9",
        anchoredText: "positive Matthew Betancourt",
        anchorConfidence: "exact",
        documentPosition: 10,
      }),
      expect.objectContaining({
        commentId: "drive-10",
        docxCommentId: "10",
        anchoredText: ".",
        anchorConfidence: "exact",
        documentPosition: 14,
      }),
      expect.objectContaining({
        commentId: "drive-13",
        docxCommentId: "13",
        anchoredText: "Lions",
        anchorConfidence: "exact",
        documentPosition: 11,
      }),
      expect.objectContaining({
        commentId: "drive-14",
        docxCommentId: "14",
        anchoredText: "American Shorthair",
        anchorConfidence: "exact",
        documentPosition: 12,
      }),
      expect.objectContaining({
        commentId: "drive-15",
        docxCommentId: "15",
        anchoredText: "Bombay",
        anchorConfidence: "exact",
        documentPosition: 13,
      }),
      expect.objectContaining({
        commentId: "drive-16",
        docxCommentId: "16",
        anchoredText: "Tab # 2 Edge Case handling",
        anchorConfidence: "exact",
        documentPosition: 15,
      }),
      expect.objectContaining({
        commentId: "drive-11",
        docxCommentId: "11",
        anchoredText: "Header content for comment testing",
        anchorConfidence: "exact",
        documentPosition: 0,
      }),
      expect.objectContaining({
        commentId: "drive-12",
        docxCommentId: "12",
        anchoredText: "Footer for comment test",
        anchorConfidence: "exact",
        documentPosition: 16,
      }),
    ]);
  });
});
