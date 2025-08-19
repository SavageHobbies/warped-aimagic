/**
 * CPI Field Mappings
 * 
 * Defines the actual mappings between CSV columns and database fields
 * including transformation functions for import and export
 */

import { CPIColumn, CPI_COLUMNS } from './cpiHeader';
import { CPIFieldMapping, WeightUnit, LengthUnit } from './cpiTypes';

/**
 * Convert weight to grams
 */
export function convertWeightToGrams(value: string, unit: WeightUnit = 'g'): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  
  switch (unit) {
    case 'kg': return num * 1000;
    case 'lb': return num * 453.592;
    case 'oz': return num * 28.3495;
    case 'g': 
    default: return num;
  }
}

/**
 * Convert length to centimeters
 */
export function convertLengthToCm(value: string, unit: LengthUnit = 'cm'): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  
  switch (unit) {
    case 'mm': return num * 0.1;
    case 'in': return num * 2.54;
    case 'ft': return num * 30.48;
    case 'cm':
    default: return num;
  }
}

/**
 * Parse boolean values
 */
export function parseBoolean(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return ['yes', 'true', '1', 'y', 't'].includes(lower);
}

/**
 * Parse numeric value with thousand separators
 */
export function parseNumber(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse date string
 */
export function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Sanitize string for CSV export
 */
export function sanitizeForCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Core field mappings between CSV and database
 */
export const FIELD_MAPPINGS: Partial<Record<CPIColumn, CPIFieldMapping>> = {
  // Required field
  'UPC': {
    csvColumn: 'UPC',
    dbTable: 'Product',
    dbField: 'upc',
    required: true
  },
  
  // Product identifiers
  'EAN': {
    csvColumn: 'EAN',
    dbTable: 'Product',
    dbField: 'ean'
  },
  'GTIN': {
    csvColumn: 'GTIN',
    dbTable: 'Product',
    dbField: 'gtin'
  },
  'SKU': {
    csvColumn: 'SKU',
    dbTable: 'Product',
    dbField: 'sku'
  },
  
  // Basic information
  'Title': {
    csvColumn: 'Title',
    dbTable: 'Product',
    dbField: 'title',
    required: true
  },
  'Description': {
    csvColumn: 'Description',
    dbTable: 'Product',
    dbField: 'description'
  },
  'Brand': {
    csvColumn: 'Brand',
    dbTable: 'Product',
    dbField: 'brand'
  },
  'Model': {
    csvColumn: 'Model',
    dbTable: 'Product',
    dbField: 'model'
  },
  'Condition': {
    csvColumn: 'Condition',
    dbTable: 'Product',
    dbField: 'condition'
  },
  
  // Quantities
  'Quantity': {
    csvColumn: 'Quantity',
    dbTable: 'Product',
    dbField: 'quantity',
    transform: (value: string) => parseNumber(value) || 0
  },
  'Stock': {
    csvColumn: 'Stock',
    dbTable: 'Product',
    dbField: 'quantity',
    transform: (value: string) => parseNumber(value) || 0
  },
  
  // Physical attributes
  'Color': {
    csvColumn: 'Color',
    dbTable: 'Product',
    dbField: 'color'
  },
  'Size': {
    csvColumn: 'Size',
    dbTable: 'Product',
    dbField: 'size'
  },
  'Material': {
    csvColumn: 'Material',
    dbTable: 'Product',
    dbField: 'material'
  },
  'Weight (unit)': {
    csvColumn: 'Weight (unit)',
    dbTable: 'Product',
    dbField: 'weight',
    transform: (value: string, options?: any) => {
      if (!value) return null;
      // Extract unit from value if present (e.g., "100g")
      const match = value.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
      if (match) {
        const num = match[1];
        const unit = (match[2] || options?.defaultUnits?.weight || 'g') as WeightUnit;
        return convertWeightToGrams(num, unit);
      }
      return convertWeightToGrams(value, options?.defaultUnits?.weight || 'g');
    }
  },
  
  // Dimensions
  'Length (unit)': {
    csvColumn: 'Length (unit)',
    dbTable: 'Product',
    dbField: 'dimensions.length',
    transform: (value: string, options?: any) => {
      if (!value) return null;
      const match = value.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
      if (match) {
        const num = match[1];
        const unit = (match[2] || options?.defaultUnits?.length || 'cm') as LengthUnit;
        return convertLengthToCm(num, unit);
      }
      return convertLengthToCm(value, options?.defaultUnits?.length || 'cm');
    }
  },
  'Width (unit)': {
    csvColumn: 'Width (unit)',
    dbTable: 'Product',
    dbField: 'dimensions.width',
    transform: (value: string, options?: any) => {
      if (!value) return null;
      const match = value.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
      if (match) {
        const num = match[1];
        const unit = (match[2] || options?.defaultUnits?.length || 'cm') as LengthUnit;
        return convertLengthToCm(num, unit);
      }
      return convertLengthToCm(value, options?.defaultUnits?.length || 'cm');
    }
  },
  'Height (unit)': {
    csvColumn: 'Height (unit)',
    dbTable: 'Product',
    dbField: 'dimensions.height',
    transform: (value: string, options?: any) => {
      if (!value) return null;
      const match = value.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
      if (match) {
        const num = match[1];
        const unit = (match[2] || options?.defaultUnits?.length || 'cm') as LengthUnit;
        return convertLengthToCm(num, unit);
      }
      return convertLengthToCm(value, options?.defaultUnits?.length || 'cm');
    }
  },
  
  // Pricing
  'Price': {
    csvColumn: 'Price',
    dbTable: 'Offer',
    dbField: 'price',
    transform: parseNumber
  },
  'Regular Price': {
    csvColumn: 'Regular Price',
    dbTable: 'Offer',
    dbField: 'listPrice',
    transform: parseNumber
  },
  'Sale Price': {
    csvColumn: 'Sale Price',
    dbTable: 'Offer',
    dbField: 'price',
    transform: parseNumber
  },
  'Lowest Recorded Price': {
    csvColumn: 'Lowest Recorded Price',
    dbTable: 'Product',
    dbField: 'lowestRecordedPrice',
    transform: parseNumber
  },
  'Highest Recorded Price': {
    csvColumn: 'Highest Recorded Price',
    dbTable: 'Product',
    dbField: 'highestRecordedPrice',
    transform: parseNumber
  },
  'Currency': {
    csvColumn: 'Currency',
    dbTable: 'Product',
    dbField: 'currency'
  },
  
  // AI Content fields
  'Type': {
    csvColumn: 'Type',
    dbTable: 'AIContent',
    dbField: 'category'
  },
  'Short Description': {
    csvColumn: 'Short Description',
    dbTable: 'AIContent',
    dbField: 'shortDescription'
  },
  'Long Description': {
    csvColumn: 'Long Description',
    dbTable: 'AIContent',
    dbField: 'productDescription'
  },
  'Unique Selling Points': {
    csvColumn: 'Unique Selling Points',
    dbTable: 'AIContent',
    dbField: 'uniqueSellingPoints'
  },
  'Key Features': {
    csvColumn: 'Key Features',
    dbTable: 'AIContent',
    dbField: 'keyFeatures'
  },
  'Specifications': {
    csvColumn: 'Specifications',
    dbTable: 'AIContent',
    dbField: 'specifications'
  },
  'Item Specifics': {
    csvColumn: 'Item Specifics',
    dbTable: 'AIContent',
    dbField: 'itemSpecifics'
  },
  'Tags': {
    csvColumn: 'Tags',
    dbTable: 'AIContent',
    dbField: 'tags'
  },
  'Features': {
    csvColumn: 'Features',
    dbTable: 'Product',
    dbField: 'features'
  },
  
  // Categories (special handling required)
  'eBay Category Id': {
    csvColumn: 'eBay Category Id',
    dbTable: 'Category',
    dbField: 'categoryId'
  },
  'eBay Category': {
    csvColumn: 'eBay Category',
    dbTable: 'Category',
    dbField: 'name'
  },
  'Google ID #': {
    csvColumn: 'Google ID #',
    dbTable: 'Category',
    dbField: 'categoryId'
  },
  'Google Category': {
    csvColumn: 'Google Category',
    dbTable: 'Category',
    dbField: 'name'
  },
  'Product Type': {
    csvColumn: 'Product Type',
    dbTable: 'Category',
    dbField: 'name'
  }
};

/**
 * Get unmapped fields that should be stored in additionalAttributes
 */
export function getUnmappedFields(): CPIColumn[] {
  const mapped = new Set(Object.keys(FIELD_MAPPINGS));
  const imageColumns = Array.from({ length: 12 }, (_, i) => `Image ${i + 1}` as CPIColumn);
  const specialColumns = ['Images', 'ID'] as CPIColumn[];
  
  return CPI_COLUMNS.filter(col => 
    !mapped.has(col) && 
    !imageColumns.includes(col) && 
    !specialColumns.includes(col)
  );
}

/**
 * Build additional attributes object from unmapped fields
 */
export function buildAdditionalAttributes(row: Record<CPIColumn, string>): Record<string, any> {
  const unmapped = getUnmappedFields();
  const attributes: Record<string, any> = {};
  
  for (const field of unmapped) {
    const value = row[field];
    if (value && value.trim()) {
      // Try to parse booleans
      if (['yes', 'no', 'true', 'false'].includes(value.toLowerCase())) {
        attributes[field] = parseBoolean(value);
      } 
      // Try to parse numbers
      else if (/^\d+(\.\d+)?$/.test(value.trim())) {
        attributes[field] = parseNumber(value);
      }
      // Otherwise store as string
      else {
        attributes[field] = value;
      }
    }
  }
  
  return attributes;
}

/**
 * Extract image URLs from row
 */
export function extractImageUrls(row: Record<CPIColumn, string>): string[] {
  const urls: string[] = [];
  
  // First check the "Images" column for comma-separated URLs
  if (row['Images']) {
    const imageList = row['Images'].split(',').map(url => url.trim()).filter(Boolean);
    urls.push(...imageList);
  }
  
  // Then check individual Image columns
  for (let i = 1; i <= 12; i++) {
    const col = `Image ${i}` as CPIColumn;
    if (row[col] && row[col].trim()) {
      urls.push(row[col].trim());
    }
  }
  
  // Remove duplicates
  return [...new Set(urls)];
}
