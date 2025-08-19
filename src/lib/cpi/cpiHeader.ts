/**
 * CPI (Comprehensive Product Information) CSV Header Definition
 * 
 * This file defines the canonical column order for CPI import/export.
 * It must match exactly the columns in csv_temp/CPI-sheet.csv
 * 
 * Total columns: 91
 * Required for import: UPC
 */

/**
 * The canonical CPI column headers in exact order.
 * DO NOT modify the order or names - they must match the CSV template exactly.
 */
export const CPI_COLUMNS = [
  'Quantity',
  'SKU',
  'UPC',
  'Condition',
  'Title',
  'Type',
  'Brand',
  'Model',
  'Short Description',
  'Description',
  'Long Description',
  'Unique Selling Points',
  'Key Features',
  'Specifications',
  'Item Specifics',
  'Tags',
  'Additional Attributes',
  'Weight (unit)',
  'Length (unit)',
  'Width (unit)',
  'Height (unit)',
  'Price',
  'Regular Price',
  'Lowest Recorded Price',
  'Highest Recorded Price',
  'Currency',
  'Sale Price',
  'Date sale price starts',
  'Date sale price ends',
  'eBay Category Id',
  'eBay Category',
  'Google ID #',
  'Google Category',
  'Product Type',
  'Color',
  'Size',
  'Dimensions',
  'Material',
  'Pattern',
  'Style',
  'Features',
  'Occasion',
  'Suggested Use',
  'Ingredients',
  'Fitment & Compatibility',
  'Installation',
  'Care Instructions',
  'Key Benefits',
  'History & Provenance',
  'Condition Details',
  'Authentication',
  'Stock',
  'Low stock amount',
  'Backorders allowed?',
  'Sold individually?',
  'Tax status',
  'Tax class',
  'ePID',
  'Shipping class',
  'Images',
  'Image 1',
  'Image 2',
  'Image 3',
  'Image 4',
  'Image 5',
  'Image 6',
  'Image 7',
  'Image 8',
  'Image 9',
  'Image 10',
  'Image 11',
  'Image 12',
  'Published',
  'Is featured?',
  'Visibility in catalog',
  'Allow customer reviews?',
  'Purchase Note',
  'Download limit',
  'Download expiry days',
  'Parent',
  'Grouped products',
  'Upsells',
  'Cross-sells',
  'External URL',
  'Button text',
  'Position',
  'Upload Status',
  'EAN',
  'GTIN',
  'ID'
] as const;

/**
 * Type representing a CPI column name
 */
export type CPIColumn = typeof CPI_COLUMNS[number];

/**
 * Total number of CPI columns
 */
export const CPI_COLUMN_COUNT = CPI_COLUMNS.length;

/**
 * Required columns for import (must have non-empty values)
 */
export const CPI_REQUIRED_COLUMNS: CPIColumn[] = ['UPC'];

/**
 * Columns that represent image URLs
 */
export const CPI_IMAGE_COLUMNS: CPIColumn[] = [
  'Image 1',
  'Image 2',
  'Image 3',
  'Image 4',
  'Image 5',
  'Image 6',
  'Image 7',
  'Image 8',
  'Image 9',
  'Image 10',
  'Image 11',
  'Image 12'
];

/**
 * Columns that have unit specifications
 */
export const CPI_UNIT_COLUMNS = {
  weight: 'Weight (unit)' as CPIColumn,
  length: 'Length (unit)' as CPIColumn,
  width: 'Width (unit)' as CPIColumn,
  height: 'Height (unit)' as CPIColumn
};

/**
 * Boolean-type columns (yes/no, true/false, 1/0)
 */
export const CPI_BOOLEAN_COLUMNS: CPIColumn[] = [
  'Backorders allowed?',
  'Sold individually?',
  'Published',
  'Is featured?',
  'Allow customer reviews?'
];

/**
 * Price-related columns
 */
export const CPI_PRICE_COLUMNS: CPIColumn[] = [
  'Price',
  'Regular Price',
  'Lowest Recorded Price',
  'Highest Recorded Price',
  'Sale Price'
];

/**
 * Date columns
 */
export const CPI_DATE_COLUMNS: CPIColumn[] = [
  'Date sale price starts',
  'Date sale price ends'
];

/**
 * Category-related columns
 */
export const CPI_CATEGORY_COLUMNS = {
  ebayId: 'eBay Category Id' as CPIColumn,
  ebayName: 'eBay Category' as CPIColumn,
  googleId: 'Google ID #' as CPIColumn,
  googleName: 'Google Category' as CPIColumn,
  productType: 'Product Type' as CPIColumn
};

/**
 * Get the column index (0-based) for a given column name
 */
export function getColumnIndex(columnName: CPIColumn): number {
  return CPI_COLUMNS.indexOf(columnName);
}

/**
 * Validate that an array of headers matches the CPI specification
 */
export function validateHeaders(headers: string[]): {
  isValid: boolean;
  missing: string[];
  extra: string[];
  outOfOrder: string[];
} {
  const missing: string[] = [];
  const extra: string[] = [];
  const outOfOrder: string[] = [];

  // Check for missing columns
  for (const expectedCol of CPI_COLUMNS) {
    if (!headers.includes(expectedCol)) {
      missing.push(expectedCol);
    }
  }

  // Check for extra columns
  for (const providedCol of headers) {
    if (!CPI_COLUMNS.includes(providedCol as CPIColumn)) {
      extra.push(providedCol);
    }
  }

  // Check order (only if no missing/extra columns)
  if (missing.length === 0 && extra.length === 0) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== CPI_COLUMNS[i]) {
        outOfOrder.push(headers[i]);
      }
    }
  }

  return {
    isValid: missing.length === 0 && extra.length === 0 && outOfOrder.length === 0,
    missing,
    extra,
    outOfOrder
  };
}

/**
 * Generate the CSV header row
 */
export function generateHeaderRow(): string {
  return CPI_COLUMNS.join(',');
}

/**
 * Create an empty CPI row object with all columns as empty strings
 */
export function createEmptyRow(): Record<CPIColumn, string> {
  const row: Partial<Record<CPIColumn, string>> = {};
  for (const column of CPI_COLUMNS) {
    row[column] = '';
  }
  return row as Record<CPIColumn, string>;
}
