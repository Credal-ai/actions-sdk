import { runAction } from "../src/app";
import assert from "node:assert";

// Configuration
const authToken = "insert-access-token"; // Test with token from: https://developers.google.com/oauthplayground/
const documentId = "insert-document-id"; // Use an existing document ID for testing

/**
 * Test inserting text into a Google Doc
 */
async function testInsertText() {
  console.log("\nTest: Insert text");
  const result = await runAction(
    "updateDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      documentId,
      requests: [
        {
          insertText: {
            text: "Hello World",
            location: {
              index: 1, // Insert after the first character
            },
          },
        },
      ],
    },
  );

  console.log("Insert Result:", result);
  assert(result.success, "Insert operation should be successful");
  assert(result.documentUrl, "Result should contain a documentUrl");
  assert(
    result.documentUrl.includes(documentId),
    "Document URL should contain the document ID",
  );
  return result;
}

/**
 * Test replacing text in a Google Doc
 */
async function testReplaceText() {
  console.log("\nTest: Replace text");
  const result = await runAction(
    "updateDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      documentId,
      requests: [
        {
          replaceAllText: {
            replaceText: "New Text",
            containsText: {
              text: "Hello World",
              matchCase: true,
            },
          },
        },
      ],
    },
  );

  console.log("Replace Result:", result);
  assert(result.success, "Replace operation should be successful");
  return result;
}

/**
 * Test deleting content from a Google Doc
 */
async function testDeleteContent() {
  console.log("\nTest: Delete content");
  const result = await runAction(
    "updateDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      documentId,
      requests: [
        {
          deleteContentRange: {
            range: {
              startIndex: 1,
              endIndex: 5, // Delete 4 characters starting from index 1
            },
          },
        },
      ],
    },
  );

  console.log("Delete Result:", result);
  assert(result.success, "Delete operation should be successful");
  return result;
}

/**
 * Test multiple operations in sequence
 */
async function testMultipleOperations() {
  console.log("\nTest: Multiple operations");
  const result = await runAction(
    "updateDoc",
    "googleOauth",
    {
      authToken,
    },
    {
      documentId,
      requests: [
        {
          insertText: {
            text: "Multiple Operations Test",
            location: {
              index: 1,
            },
          },
        },
        {
          replaceAllText: {
            replaceText: "Updated Text",
            containsText: {
              text: "Operations",
            },
          },
        },
        {
          deleteContentRange: {
            range: {
              startIndex: 20,
              endIndex: 24,
            },
          },
        },
      ],
    },
  );

  console.log("Multiple Operations Result:", result);
  assert(result.success, "Multiple operations should be successful");
  return result;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("Running tests for Google OAuth updateDoc");

  try {
    const insertResult = await testInsertText();
    const replaceResult = await testReplaceText();
    const deleteResult = await testDeleteContent();
    const multipleResult = await testMultipleOperations();

    console.log("\nAll tests completed successfully");
    console.log("Link to Google Doc:", insertResult.documentUrl);

    return {
      insertResult,
      replaceResult,
      deleteResult,
      multipleResult,
    };
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

// Run all tests
runTests();
