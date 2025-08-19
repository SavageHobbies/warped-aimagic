# Multi-Format Export - Manual Test Checklist

This checklist provides comprehensive manual testing scenarios for the multi-format export functionality.

## Prerequisites
- [ ] Development server is running (`npm run dev`)
- [ ] Database has test products with various attributes
- [ ] Browser developer tools are open for monitoring network requests

## UI Testing

### Export Button Visibility
- [ ] Navigate to `/inventory` page
- [ ] Verify "Export" button is visible in the toolbar
- [ ] Verify button is disabled when no products exist
- [ ] Verify button is enabled when products exist

### Export Dropdown Menu
- [ ] Click "Export" button
- [ ] Verify dropdown shows three options:
  - [ ] Export to CPI
  - [ ] Export to Baselinker
  - [ ] Export to eBay
- [ ] Click outside dropdown - verify it closes
- [ ] Press ESC key - verify dropdown closes

### Export Modal - CPI Format
- [ ] Click "Export to CPI"
- [ ] Verify modal title shows "Export to CPI"
- [ ] Verify Export Scope section shows:
  - [ ] "All filtered products" radio option
  - [ ] "Selected products only" radio option
- [ ] Verify Export Options section shows:
  - [ ] Currency dropdown (USD, EUR, GBP, PLN)
  - [ ] CSV Delimiter dropdown (comma, semicolon)
  - [ ] Include UTF-8 BOM checkbox
- [ ] Click Cancel - verify modal closes
- [ ] Click X button - verify modal closes

### Export Modal - Baselinker Format
- [ ] Click "Export to Baselinker"
- [ ] Verify modal shows Baselinker-specific options
- [ ] Verify currency defaults to EUR
- [ ] Verify delimiter defaults to semicolon

### Export Modal - eBay Format
- [ ] Click "Export to eBay"
- [ ] Verify modal shows eBay-specific options
- [ ] Verify currency defaults to USD

## Functional Testing

### Export All Products
- [ ] Clear all filters
- [ ] Click Export > Export to CPI
- [ ] Select "All filtered products"
- [ ] Click Export button
- [ ] Verify file downloads with name pattern: `inventory_cpi_YYYYMMDD_HHMMSS.csv`
- [ ] Open file and verify:
  - [ ] Headers are present
  - [ ] All products are included
  - [ ] Data formatting is correct

### Export Filtered Products
- [ ] Apply search filter (e.g., search for specific brand)
- [ ] Click Export > Export to CPI
- [ ] Select "All filtered products"
- [ ] Export and verify only filtered products are included
- [ ] Test with different filters:
  - [ ] Category filter
  - [ ] Condition filter
  - [ ] Stock level filter
  - [ ] Combined filters

### Export Selected Products
- [ ] Select 2-3 specific products using checkboxes
- [ ] Click Export > Export to Baselinker
- [ ] Select "Selected products only"
- [ ] Export and verify only selected products are included
- [ ] Deselect all and try export - verify appropriate message

### Export Options Testing

#### Currency Testing
- [ ] Export with USD - verify prices show in USD format
- [ ] Export with EUR - verify prices show in EUR format
- [ ] Export with GBP - verify prices show in GBP format
- [ ] Export with PLN - verify prices show in PLN format

#### Delimiter Testing
- [ ] Export with comma delimiter
- [ ] Open in text editor - verify fields separated by commas
- [ ] Export with semicolon delimiter
- [ ] Open in text editor - verify fields separated by semicolons

#### Excel Compatibility
- [ ] Export with "Include UTF-8 BOM" checked
- [ ] Open in Excel - verify no character encoding issues
- [ ] Export without BOM
- [ ] Open in Excel - note any character issues with special characters

## Format-Specific Testing

### CPI Format
- [ ] Export products in CPI format
- [ ] Verify columns include:
  - [ ] SKU
  - [ ] Title
  - [ ] Purchase Price
  - [ ] List Price
  - [ ] Quantity
  - [ ] Category
  - [ ] Supplier
  - [ ] Location
  - [ ] Barcode
  - [ ] Weight (kg)
  - [ ] Currency
  - [ ] Last Updated
  - [ ] Notes
- [ ] Verify date format is ISO 8601
- [ ] Verify weight has 3 decimal places
- [ ] Verify prices have 2 decimal places

### Baselinker Format
- [ ] Export products in Baselinker format
- [ ] Verify columns include:
  - [ ] Product name
  - [ ] SKU
  - [ ] EAN
  - [ ] UPC
  - [ ] Price (gross)
  - [ ] Stock
  - [ ] Weight
  - [ ] Description
  - [ ] Category
  - [ ] Manufacturer
  - [ ] Tax rate (%)
  - [ ] Images
- [ ] Verify tax rate defaults to 23%
- [ ] Verify description is truncated at 5000 chars
- [ ] Verify maximum 5 images are included

### eBay Format
- [ ] Export products in eBay format
- [ ] Verify first column header starts with "Action(SiteID=US|..."
- [ ] Verify Action column contains "Add"
- [ ] Verify ConditionID is 1000 for New items
- [ ] Verify Duration is "GTC"
- [ ] Verify CustomLabel format is "INV-{productId}"
- [ ] Verify title is max 80 characters
- [ ] Verify subtitle is max 55 characters

## Edge Cases & Error Handling

### Empty Results
- [ ] Apply filter that matches no products
- [ ] Try to export - verify error message appears
- [ ] Message should say "No products found matching the criteria"

### Special Characters
- [ ] Create product with special characters (é, ñ, ü, etc.)
- [ ] Export and verify characters display correctly
- [ ] Test with quotes in product title
- [ ] Test with commas in description
- [ ] Test with newlines in description

### CSV Injection Protection
- [ ] Create product with title starting with "="
- [ ] Create product with title starting with "+"
- [ ] Create product with title starting with "-"
- [ ] Create product with title starting with "@"
- [ ] Export and verify these are prefixed with apostrophe

### Large Dataset
- [ ] If possible, test with 1000+ products
- [ ] Verify export completes successfully
- [ ] Check performance (should complete within 30 seconds)
- [ ] Verify file size is reasonable

### Network Issues
- [ ] Start export and disconnect network
- [ ] Verify appropriate error message
- [ ] Reconnect and retry - verify success

## Browser Compatibility

### Chrome/Edge
- [ ] Test all export formats
- [ ] Verify downloads work correctly
- [ ] Check console for errors

### Firefox
- [ ] Test all export formats
- [ ] Verify downloads work correctly
- [ ] Check console for errors

### Safari (if available)
- [ ] Test all export formats
- [ ] Verify downloads work correctly
- [ ] Check console for errors

## Performance Testing

### Response Time
- [ ] Export 10 products - should complete in < 2 seconds
- [ ] Export 100 products - should complete in < 5 seconds
- [ ] Export 1000 products - should complete in < 30 seconds

### Concurrent Exports
- [ ] Start CPI export
- [ ] Immediately start Baselinker export
- [ ] Verify both complete successfully
- [ ] Check both files are correct

### Memory Usage
- [ ] Monitor browser memory before export
- [ ] Export large dataset
- [ ] Verify memory returns to normal after export

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab to Export button - verify focus visible
- [ ] Press Enter - verify dropdown opens
- [ ] Use arrow keys to navigate options
- [ ] Press Enter to select format
- [ ] Tab through modal fields
- [ ] Press Escape to close modal

### Screen Reader (if available)
- [ ] Verify Export button is announced
- [ ] Verify dropdown options are announced
- [ ] Verify modal title and options are announced
- [ ] Verify success/error messages are announced

## Regression Testing

### After Export
- [ ] Verify page state is maintained
- [ ] Filters remain applied
- [ ] Selected products remain selected
- [ ] Sort order is maintained
- [ ] Pagination position is maintained

### Multiple Exports
- [ ] Export same data in different formats
- [ ] Verify consistency across formats
- [ ] Export, modify filter, export again
- [ ] Verify each export reflects current state

## Security Testing

### File Names
- [ ] Verify downloaded files have safe names
- [ ] No path traversal attempts (../, etc.)
- [ ] Timestamp format prevents conflicts

### Data Leakage
- [ ] Export and check for sensitive data
- [ ] Verify no API keys or secrets in export
- [ ] Check no internal IDs that shouldn't be exposed

## Documentation Verification

### User Guide
- [ ] Follow user guide step-by-step
- [ ] Verify all screenshots match current UI
- [ ] Test all troubleshooting scenarios
- [ ] Verify tips and best practices work

### API Documentation
- [ ] Test API directly with curl/Postman
- [ ] Verify all parameters work as documented
- [ ] Check error responses match documentation

## Sign-off

- [ ] All critical paths tested
- [ ] No blocking issues found
- [ ] Performance acceptable
- [ ] Documentation accurate
- [ ] Ready for production

**Tested by:** _________________  
**Date:** _________________  
**Version:** _________________  
**Notes:** _________________
