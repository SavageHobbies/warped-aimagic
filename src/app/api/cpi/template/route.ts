import { NextResponse } from 'next/server';
import { CPI_COLUMNS } from '@/lib/cpi/cpiHeader';

/**
 * GET /api/cpi/template
 * 
 * Download the CPI (Comprehensive Product Information) CSV template.
 * Returns a CSV file with the header row and optionally a sample row.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSample = searchParams.get('sample') === 'true';

    // Build CSV content
    const csvRows: string[] = [];
    
    // Add header row
    csvRows.push(CPI_COLUMNS.map(escapeCSVField).join(','));
    
    // Optionally add a sample row (commented out)
    if (includeSample) {
      const sampleRow = [
        '1', // Quantity
        'SKU-001', // SKU
        '123456789012', // UPC
        'New', // Condition
        'Sample Product Title', // Title
        'Electronics', // Type
        'Sample Brand', // Brand
        'Model-X1', // Model
        'Short description of the product', // Short Description
        'This is the main product description', // Description
        'This is a longer, more detailed description of the product...', // Long Description
        'Fast shipping, High quality, Great value', // Unique Selling Points
        'Feature 1, Feature 2, Feature 3', // Key Features
        'Weight: 100g, Dimensions: 10x5x2cm', // Specifications
        'Color: Black, Material: Plastic', // Item Specifics
        'electronics, gadget, sample', // Tags
        '{"warranty": "1 year", "certification": "CE"}', // Additional Attributes
        '100', // Weight (unit) - in grams
        '10', // Length (unit) - in cm
        '5', // Width (unit) - in cm
        '2', // Height (unit) - in cm
        '29.99', // Price
        '39.99', // Regular Price
        '24.99', // Lowest Recorded Price
        '44.99', // Highest Recorded Price
        'USD', // Currency
        '27.99', // Sale Price
        '2025-01-01', // Date sale price starts
        '2025-01-31', // Date sale price ends
        '293', // eBay Category Id
        'Consumer Electronics > Gadgets', // eBay Category
        '2092', // Google ID #
        'Electronics > Consumer Electronics', // Google Category
        'Gadgets', // Product Type
        'Black', // Color
        'Standard', // Size
        '10cm x 5cm x 2cm', // Dimensions
        'Plastic', // Material
        '', // Pattern
        'Modern', // Style
        'Portable, Lightweight, Durable', // Features
        '', // Occasion
        'Daily use', // Suggested Use
        '', // Ingredients
        'Compatible with all devices', // Fitment & Compatibility
        'Plug and play', // Installation
        'Wipe with dry cloth', // Care Instructions
        'Saves time, Easy to use', // Key Benefits
        '', // History & Provenance
        'Brand new in original packaging', // Condition Details
        '', // Authentication
        '50', // Stock
        '5', // Low stock amount
        'yes', // Backorders allowed?
        'yes', // Sold individually?
        'taxable', // Tax status
        'standard', // Tax class
        '', // ePID
        'standard', // Shipping class
        'https://example.com/image1.jpg,https://example.com/image2.jpg', // Images
        'https://example.com/image1.jpg', // Image 1
        'https://example.com/image2.jpg', // Image 2
        '', // Image 3
        '', // Image 4
        '', // Image 5
        '', // Image 6
        '', // Image 7
        '', // Image 8
        '', // Image 9
        '', // Image 10
        '', // Image 11
        '', // Image 12
        'yes', // Published
        'no', // Is featured?
        'visible', // Visibility in catalog
        'yes', // Allow customer reviews?
        '', // Purchase Note
        '', // Download limit
        '', // Download expiry days
        '', // Parent
        '', // Grouped products
        '', // Upsells
        '', // Cross-sells
        '', // External URL
        '', // Button text
        '0', // Position
        'pending', // Upload Status
        '1234567890123', // EAN
        '12345678901234', // GTIN
        '' // ID
      ];
      
      // Add sample row as a comment
      csvRows.push('# SAMPLE: ' + sampleRow.map(escapeCSVField).join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Create response with CSV content
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="CPI_template.csv"',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating CPI template:', error);
    return NextResponse.json(
      { error: 'Failed to generate CPI template' },
      { status: 500 }
    );
  }
}

/**
 * Escape a field value for CSV format
 */
function escapeCSVField(field: string): string {
  // If field contains comma, newline, or double quote, wrap in quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    // Escape double quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return field;
}
