# Google Sheets Read Action Implementation

## Overview

This document outlines the implementation of the `readSpreadsheet` action for Google Sheets, completing the CRUD operations in Credal's Google OAuth provider.

## Current Status

✅ **Implementation Created**: `src/actions/providers/google-oauth/readSpreadsheet.ts`
⏳ **Schema Update Required**: Add action definition to `src/actions/schema.yaml`
⏳ **Action Mapper Update Required**: Add to `src/actions/actionMapper.ts`
⏳ **Type Generation Required**: Run `npm run generate:types`

## Action Details

### Purpose
Reads data from a specified range in an existing Google Spreadsheet using the Google Sheets API v4.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheetId` | string | ✅ Yes | The ID of the spreadsheet to read from |
| `range` | string | No | A1 notation range (defaults to "A1:Z1000") |
| `sheetName` | string | No | Specific sheet name to read from |
| `includeHeaders` | boolean | No | Whether to treat first row as headers (defaults to true) |

### Output Schema

```typescript
{
  success: boolean;
  spreadsheetId: string;
  range: string;
  values: string[][];           // 2D array of cell values
  headers?: string[];           // First row if includeHeaders=true
  rowCount: number;            // Number of data rows
  columnCount: number;         // Maximum columns in any row
  error?: string;              // Error message if success=false
}
```

### Example Usage

```typescript
// Read entire sheet with headers
const result = await readSpreadsheet({
  spreadsheetId: "1abc123...",
  includeHeaders: true
});

// Read specific range from named sheet
const result = await readSpreadsheet({
  spreadsheetId: "1abc123...",
  range: "A1:C10",
  sheetName: "Data",
  includeHeaders: false
});
```

## Schema Definition Required

Add this to `src/actions/schema.yaml` under `googleOauth` actions (after `appendRowsToSpreadsheet`):

```yaml
      readSpreadsheet:
        displayName: Read Spreadsheet Data
        description: Reads data from a specified range in an existing Google Sheet.
        scopes:
          - https://www.googleapis.com/auth/spreadsheets.readonly
          - https://www.googleapis.com/auth/spreadsheets
        parameters:
          type: object
          required: [spreadsheetId]
          properties:
            spreadsheetId:
              type: string
              description: The ID of the spreadsheet to read from (found in the spreadsheet URL).
            range:
              type: string
              description: The A1 notation of the range to read (e.g., "A1:C10"). Defaults to "A1:Z1000" if not specified.
            sheetName:
              type: string
              description: The name of the specific sheet to read from. If not provided, reads from the first sheet.
            includeHeaders:
              type: boolean
              description: Whether to treat the first row as headers and return them separately. Defaults to true.
        output:
          type: object
          required: [success]
          properties:
            success:
              type: boolean
              description: Whether the read operation was successful.
            error:
              type: string
              description: Error message if the operation failed.
            spreadsheetId:
              type: string
              description: The ID of the spreadsheet that was read.
            range:
              type: string
              description: The actual range that was read from the spreadsheet.
            values:
              type: array
              description: The data read from the spreadsheet as a 2D array of strings.
              items:
                type: array
                items:
                  type: string
            headers:
              type: array
              description: Column headers from the first row (only present if includeHeaders=true).
              items:
                type: string
            rowCount:
              type: integer
              description: The number of data rows read (excluding headers).
            columnCount:
              type: integer
              description: The maximum number of columns in any row.
```

## Action Mapper Update Required

Add this import and mapping to `src/actions/actionMapper.ts`:

```typescript
// Add to imports section
import readSpreadsheet from "./providers/google-oauth/readSpreadsheet.js";

// Add to googleOauth section in actionMapper
googleOauth: {
  // ... existing actions ...
  readSpreadsheet,
},
```

## API Integration

### Google Sheets API Endpoint
- **Method**: GET
- **URL**: `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}`
- **Auth**: OAuth 2.0 Bearer token
- **Scopes**: `spreadsheets.readonly` or `spreadsheets`

### Error Handling

The implementation handles common Google Sheets API errors:

| HTTP Status | Error Type | User-Friendly Message |
|-------------|------------|----------------------|
| 400 | Bad Request | "Invalid range or spreadsheet format" |
| 403 | Forbidden | "Insufficient permissions to read this spreadsheet" |
| 404 | Not Found | "Spreadsheet not found or you don't have access to it" |

## Use Cases

### Data Analysis
```typescript
// Read sales data for analysis
const salesData = await readSpreadsheet({
  spreadsheetId: "1abc123...",
  sheetName: "Sales Q1",
  range: "A1:F100",
  includeHeaders: true
});

// Process headers and data
const { headers, values } = salesData;
```

### Configuration Management
```typescript
// Read configuration values
const config = await readSpreadsheet({
  spreadsheetId: "1config123...",
  range: "A1:B50",
  includeHeaders: false
});

// Convert to key-value pairs
const configMap = Object.fromEntries(config.values);
```

### Report Generation
```typescript
// Read data for report generation
const reportData = await readSpreadsheet({
  spreadsheetId: "1report123...",
  sheetName: "Monthly Stats"
});

// Generate report from structured data
```

## Testing

### Manual Testing Steps

1. Create a test spreadsheet with sample data
2. Get the spreadsheet ID from the URL
3. Test various parameter combinations:
   - With and without `sheetName`
   - Different `range` values
   - `includeHeaders` true/false
4. Verify error handling with invalid inputs

### Integration Testing

```typescript
// Test basic read
const result1 = await runAction(
  "readSpreadsheet",
  "googleOauth",
  { authToken: "..." },
  { spreadsheetId: "1abc123..." }
);

// Test with specific range
const result2 = await runAction(
  "readSpreadsheet", 
  "googleOauth",
  { authToken: "..." },
  { 
    spreadsheetId: "1abc123...",
    range: "A1:C5",
    sheetName: "Sheet1",
    includeHeaders: true
  }
);
```

## Benefits

### Completes CRUD Operations
- **Create**: `createSpreadsheet` ✅
- **Read**: `readSpreadsheet` ✅ (NEW)
- **Update**: `updateSpreadsheet` ✅  
- **Delete**: `deleteRowFromSpreadsheet` ✅

### Enhanced Agent Capabilities
- Data analysis from existing spreadsheets
- Configuration reading
- Report generation from structured data
- Integration with external data sources

### Flexible Data Access
- Range-based reading for efficiency
- Header handling for structured data
- Sheet-specific access for complex workbooks
- Comprehensive metadata for data processing

## Next Steps

1. **Update Schema**: Add the action definition to `schema.yaml`
2. **Update Action Mapper**: Add the import and mapping
3. **Generate Types**: Run `npm run generate:types`
4. **Version Bump**: Update `package.json` version
5. **Publish**: Run `npm publish --access public`
6. **Test Integration**: Verify the action works in Credal agents

## Related Documentation

- [Google Sheets API v4 Documentation](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get)
- [Credal Actions SDK README](../README.md)
- [Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#sheets)

---

*Created: February 25, 2026*  
*Author: Matthew Betancourt*  
*Status: Implementation Complete, Schema Update Pending*