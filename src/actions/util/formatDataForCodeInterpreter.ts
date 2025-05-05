/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Formats query results into either CSV or JSON format for code interpreter
 * @param queryResults The results from a database query
 * @param outputFormat The desired output format ("csv" or "json")
 * @returns Object containing formatted data and result count
 */
export function formatDataForCodeInterpreter(queryResults: any[], outputFormat: string = "json"): string {
  let formattedData: string;

  if (outputFormat.toLowerCase() === "csv") {
    if (queryResults.length === 0) {
      formattedData = "";
    } else {
      const headers = Object.keys(queryResults[0]).join(",");

      // Helper function to properly escape CSV fields
      const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) return "null";

        const stringValue = typeof field === "object" ? JSON.stringify(field) : String(field);

        // If the field contains commas, quotes, or newlines, it needs to be quoted
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n") ||
          stringValue.includes("\r")
        ) {
          // Escape quotes by doubling them and wrap in quotes
          return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
      };

      const rows = queryResults.map(row => Object.values(row).map(escapeCsvField).join(","));

      formattedData = [headers, ...rows].join("\n");
    }
  } else {
    // Default to JSON - keep it formatted for readability
    formattedData = JSON.stringify(queryResults, null, 2);
  }

  return formattedData;
}
