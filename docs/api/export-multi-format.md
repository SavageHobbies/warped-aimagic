# Multi-Format Export API Documentation

## Overview
The Multi-Format Export API provides a unified endpoint for exporting inventory data in various formats including CPI, Baselinker, and eBay.

## Endpoint

### Export Inventory Data
```
POST /api/export/multi-format
```

Exports inventory data in the specified format with configurable options.

#### Request Body

```typescript
{
  format: "cpi" | "baselinker" | "ebay",  // Required: Export format
  selection?: {
    ids?: string[],                        // Export specific product IDs
    filters?: {                            // OR filter products
      search?: string,                     // Search in title, UPC, brand
      condition?: string,                  // Filter by condition
      categoryId?: string,                 // Filter by category
      minStock?: number,                   // Minimum stock level
      maxStock?: number,                   // Maximum stock level
      updatedAfter?: string                // ISO date string
    }
  },
  options?: {
    currency?: string,                     // Default: "USD"
    delimiter?: "," | ";",                 // Default: ","
    excelFriendly?: boolean,              // Default: true (adds UTF-8 BOM)
    includeHeaders?: boolean,              // Default: true
    timezone?: string,                     // IANA timezone
    maxRows?: number                       // Default: 50000
  }
}
```

#### Response

**Success (200 OK)**
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="inventory_{format}_{timestamp}.csv"`
- Body: CSV file content

**Error Responses**
- `400 Bad Request`: Invalid format or parameters
- `404 Not Found`: No products matching criteria
- `500 Internal Server Error`: Server error during export

### Get Available Formats
```
GET /api/export/multi-format
```

Returns available export formats and their options.

#### Response

```json
{
  "formats": [
    {
      "id": "cpi",
      "name": "CPI Sheet",
      "description": "Internal CPI format for inventory management",
      "headers": ["SKU", "Title", "Purchase Price", ...]
    },
    {
      "id": "baselinker",
      "name": "Baselinker",
      "description": "Baselinker marketplace integration format",
      "headers": ["Product name", "SKU", "EAN", ...]
    },
    {
      "id": "ebay",
      "name": "eBay",
      "description": "eBay bulk listing upload format",
      "headers": ["Action(SiteID=US|...)", "Category", ...]
    }
  ],
  "options": {
    "currency": ["USD", "EUR", "GBP", "PLN"],
    "delimiter": [",", ";"],
    "priceSource": ["list", "sale", "computed"],
    "timezone": ["UTC", "America/New_York", "Europe/Warsaw"]
  }
}
```

## Format Specifications

### CPI Format
Internal inventory management format with the following columns:
- **SKU**: Product ID or SKU
- **Title**: Product title
- **Purchase Price**: Cost/purchase price (2 decimals)
- **List Price**: Selling/listing price (2 decimals)
- **Quantity**: Stock quantity
- **Category**: Product category name
- **Supplier**: Supplier name
- **Location**: Warehouse location (default: "Main Warehouse")
- **Barcode**: EAN or UPC
- **Weight (kg)**: Weight in kilograms (3 decimals)
- **Currency**: Currency code
- **Last Updated**: ISO 8601 timestamp
- **Notes**: Additional notes

### Baselinker Format
Baselinker marketplace integration format:
- **Product name**: Product title
- **SKU**: Product ID or SKU
- **EAN**: European Article Number
- **UPC**: Universal Product Code
- **Price**: Gross price (2 decimals)
- **Stock**: Quantity in stock
- **Weight**: Weight in kg (3 decimals)
- **Description**: Product description (HTML sanitized, max 5000 chars)
- **Category**: Category name
- **Manufacturer**: Brand or manufacturer
- **Tax rate (%)**: VAT rate (default: 23)
- **Images**: Comma-separated image URLs (max 5)

### eBay Format
eBay bulk listing upload format:
- **Action**: Always "Add" for new listings
- **Category**: eBay category ID
- **ConditionID**: 1000 for new items
- **Title**: Product title (max 80 chars)
- **SubTitle**: Short description (max 55 chars)
- **PicURL**: Primary image URL
- **Quantity**: Stock quantity
- **StartPrice**: Starting auction price
- **BuyItNowPrice**: Fixed price
- **Duration**: "GTC" (Good Till Cancelled)
- **Brand**: Product brand
- **MPN**: Manufacturer Part Number
- **UPC**: Universal Product Code
- **EAN**: European Article Number
- **CustomLabel**: Internal reference (INV-{id})
- **ItemSpecifics**: Semicolon-separated key:value pairs

## Security Features

### CSV Injection Protection
Fields starting with dangerous characters (`=`, `+`, `-`, `@`) are automatically prefixed with an apostrophe (`'`) to prevent formula injection in spreadsheet applications.

### Field Escaping
- Fields containing commas, quotes, or newlines are properly quoted
- Double quotes within fields are escaped as `""`
- Newlines are preserved within quoted fields

### Excel Compatibility
When `excelFriendly` is true:
- UTF-8 BOM (Byte Order Mark) is added for proper character encoding
- Line endings use CRLF (`\r\n`)
- All fields are quoted for consistency

## Examples

### Export All Products to CPI Format
```javascript
const response = await fetch('/api/export/multi-format', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'cpi',
    options: {
      currency: 'USD',
      excelFriendly: true
    }
  })
});

const blob = await response.blob();
// Download the file...
```

### Export Selected Products to Baselinker
```javascript
const response = await fetch('/api/export/multi-format', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'baselinker',
    selection: {
      ids: ['prod-1', 'prod-2', 'prod-3']
    },
    options: {
      currency: 'EUR',
      delimiter: ';'
    }
  })
});
```

### Export Filtered Products to eBay
```javascript
const response = await fetch('/api/export/multi-format', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'ebay',
    selection: {
      filters: {
        condition: 'New',
        minStock: 1
      }
    }
  })
});
```

## Performance Considerations

- **Row Limit**: Default maximum of 50,000 rows per export
- **Streaming**: Large datasets are streamed to prevent memory issues
- **Timeout**: Export requests may timeout after 30 seconds for very large datasets
- **Rate Limiting**: Consider implementing rate limits for production use

## Troubleshooting

### Common Issues

1. **Excel shows garbled characters**
   - Ensure `excelFriendly: true` is set
   - Open CSV with UTF-8 encoding in Excel

2. **Fields not properly separated**
   - Check delimiter setting matches your locale
   - European users may need `delimiter: ";"`

3. **Missing products in export**
   - Verify filter criteria
   - Check product validation (some products may be skipped if invalid)

4. **Formula injection warnings**
   - This is expected behavior for security
   - Apostrophe prefix prevents formula execution

## Migration from Legacy Endpoints

If migrating from the legacy `/api/ebay/export` endpoint:
1. Change endpoint to `/api/export/multi-format`
2. Add `format: "ebay"` to request body
3. Move product IDs to `selection.ids` array
4. Response format remains identical
