# Exporting Inventory Data

This guide explains how to export your inventory data in various formats for use with different platforms and services.

## Available Export Formats

The inventory system supports exporting data in three formats:

1. **CPI Sheet** - Internal format for inventory management and analysis
2. **Baselinker** - For importing into Baselinker marketplace management system
3. **eBay** - For bulk uploading listings to eBay

## How to Export Data

### Step 1: Navigate to Inventory Page
Go to the Inventory page where you can see all your products listed.

### Step 2: Select Products to Export (Optional)
You have two options for selecting which products to export:

#### Option A: Export All Filtered Products
- Apply any filters you want (search, category, condition, etc.)
- The export will include all products matching your current filters

#### Option B: Export Selected Products
- Check the checkbox next to specific products you want to export
- The export will only include the checked products

### Step 3: Click Export Button
Click the "Export" button in the top toolbar. A dropdown menu will appear with format options.

### Step 4: Choose Export Format
Select one of the available formats:
- **Export to CPI** - For internal inventory tracking
- **Export to Baselinker** - For Baselinker integration
- **Export to eBay** - For eBay bulk upload

### Step 5: Configure Export Options
After selecting a format, a modal dialog will appear with export options:

#### Export Scope
- **All filtered products** - Exports all products matching current filters
- **Selected products only** - Exports only checked products

#### Export Options
- **Currency**: Choose the currency for prices (USD, EUR, GBP, PLN)
- **CSV Delimiter**: Choose comma (,) or semicolon (;) based on your locale
- **Include UTF-8 BOM**: Check this for proper character display in Excel

### Step 6: Download File
Click "Export" in the modal. The file will automatically download to your computer.

## Format Details

### CPI Sheet Format
Best for internal inventory management and analysis.

**Includes:**
- Product SKU and title
- Purchase and list prices
- Stock quantities
- Categories and suppliers
- Warehouse locations
- Barcodes and weights
- Last update timestamps
- Custom notes

**Use Cases:**
- Inventory valuation reports
- Stock level analysis
- Supplier tracking
- Internal auditing

### Baselinker Format
Designed for Baselinker marketplace integration.

**Includes:**
- Product names and SKUs
- EAN/UPC codes
- Pricing with VAT
- Stock levels
- Product descriptions
- Categories and manufacturers
- Product images (up to 5)

**Use Cases:**
- Bulk product import to Baselinker
- Marketplace synchronization
- Multi-channel selling

### eBay Format
Compatible with eBay's bulk listing upload tool.

**Includes:**
- eBay-specific fields (Action, Category ID, Condition ID)
- Listing titles and subtitles
- Pricing (start price and Buy It Now)
- Product identifiers (UPC, EAN, MPN)
- Brand information
- Image URLs
- Custom labels for tracking

**Use Cases:**
- Bulk listing creation on eBay
- Inventory synchronization with eBay
- Mass price updates

## Tips for Successful Exports

### Excel Compatibility
If you plan to open the CSV file in Microsoft Excel:
1. Always check "Include UTF-8 BOM for Excel" option
2. Use semicolon (;) delimiter if you're in Europe
3. Use comma (,) delimiter if you're in the US

### Large Exports
- Exports are limited to 50,000 products at once
- For larger inventories, use filters to export in batches
- Consider exporting by category or supplier

### Character Encoding
- Special characters (é, ñ, ü, etc.) are properly preserved
- If you see garbled text, ensure your spreadsheet app uses UTF-8 encoding

### Formula Injection Protection
- For security, fields starting with =, +, -, or @ are prefixed with '
- This prevents malicious formula execution in spreadsheets
- The apostrophe is visible but doesn't affect data processing

## Troubleshooting

### Export Button Not Working
- Ensure you have products in your inventory
- Check that filters aren't excluding all products
- Verify your browser allows file downloads

### Downloaded File is Empty
- Check if any products match your filter criteria
- Ensure selected products are valid (have required fields)
- Try exporting without filters first

### Excel Shows Wrong Characters
- Re-export with "Include UTF-8 BOM" checked
- Open Excel, go to Data > From Text, select UTF-8 encoding
- Try using Google Sheets instead

### Fields Not Separated Properly
- Your locale may require a different delimiter
- European users: try semicolon (;) instead of comma (,)
- US users: try comma (,) instead of semicolon (;)

### eBay Upload Errors
- Ensure all required fields are filled (title, price, quantity)
- Check that category IDs are valid for eBay
- Verify image URLs are accessible
- Product titles must be under 80 characters

### Baselinker Import Issues
- Verify EAN/UPC codes are valid
- Ensure prices include VAT if required
- Check that weight values are numeric
- Image URLs must be publicly accessible

## Best Practices

1. **Regular Exports**: Schedule regular exports for backup purposes
2. **Test Small Batches**: When using a new platform, test with a few products first
3. **Validate Data**: Review exported files before importing to external systems
4. **Keep Templates**: Save successful export configurations for reuse
5. **Document Changes**: Note any manual edits made to exported files

## Platform-Specific Notes

### eBay
- Duration is set to "GTC" (Good Till Cancelled) by default
- Condition ID 1000 represents "New" items
- Custom labels use format "INV-{product-id}" for tracking
- Item specifics are formatted as semicolon-separated key:value pairs

### Baselinker
- Default tax rate is 23% (adjust if needed)
- Descriptions are HTML-sanitized and limited to 5000 characters
- Maximum 5 images per product (additional images ignored)
- Weight must be in kilograms

### CPI
- Timestamps are in ISO 8601 format
- Prices are displayed with 2 decimal places
- Weights are displayed with 3 decimal places
- Default location is "Main Warehouse" if not specified

## Need Help?

If you encounter issues not covered in this guide:
1. Check the API documentation for technical details
2. Review error messages for specific issues
3. Contact support with export format and error details
