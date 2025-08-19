/**
 * CPI (Comprehensive Product Information) Type Definitions
 * 
 * This file defines the TypeScript types for CPI import/export operations
 */

import { CPIColumn } from './cpiHeader';

/**
 * Represents a raw CSV row as parsed from the file
 */
export type CPIRawRow = Record<CPIColumn, string>;

/**
 * Normalized and typed CPI row after processing
 */
export interface CPINormalizedRow {
  // Required field
  upc: string;
  
  // Product identifiers
  ean?: string;
  gtin?: string;
  sku?: string;
  
  // Basic information
  title: string;
  description?: string;
  brand?: string;
  model?: string;
  condition: string;
  
  // Quantities
  quantity: number;
  stock?: number;
  
  // Physical attributes
  color?: string;
  size?: string;
  material?: string;
  weight?: number; // in grams
  dimensions?: {
    length?: number; // in cm
    width?: number;  // in cm
    height?: number; // in cm
  };
  
  // Pricing
  price?: number;
  regularPrice?: number;
  salePrice?: number;
  lowestRecordedPrice?: number;
  highestRecordedPrice?: number;
  currency: string;
  salePriceStartDate?: Date;
  salePriceEndDate?: Date;
  
  // Categories
  ebayCategory?: {
    id?: string;
    name?: string;
  };
  googleCategory?: {
    id?: string;
    name?: string;
  };
  productType?: string;
  
  // Content fields
  type?: string;
  shortDescription?: string;
  longDescription?: string;
  uniqueSellingPoints?: string;
  keyFeatures?: string;
  specifications?: string;
  itemSpecifics?: string;
  tags?: string;
  features?: string;
  
  // Images
  images: string[]; // Array of image URLs
  imageUrls: (string | undefined)[]; // Individual image columns 1-12
  
  // Additional fields for round-trip
  additionalAttributes: Record<string, any>;
  
  // Metadata
  id?: string; // Product ID (export only)
  uploadStatus?: string;
}

/**
 * Import options for CPI processing
 */
export interface CPIImportOptions {
  mode: 'upsert' | 'create-only' | 'update-only';
  conflictStrategy: 'preferCsv' | 'preferDb';
  defaultUnits: {
    weight: 'g' | 'kg' | 'lb' | 'oz';
    length: 'cm' | 'mm' | 'in';
  };
  dryRun: boolean;
  concurrency: number;
}

/**
 * Export options for CPI generation
 */
export interface CPIExportOptions {
  includeImages: boolean;
  maxImages: number;
  includeAIContent: boolean;
  includeDrafts: boolean;
}

/**
 * Import result for a single row
 */
export interface CPIRowResult {
  rowIndex: number;
  upc?: string;
  success: boolean;
  action?: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
  warnings?: string[];
  fields?: string[]; // Fields that were modified
}

/**
 * Summary of import operation
 */
export interface CPIImportSummary {
  totalRows: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: CPIRowResult[];
  warnings: string[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

/**
 * Database mapping configuration
 */
export interface CPIFieldMapping {
  csvColumn: CPIColumn;
  dbTable: 'Product' | 'AIContent' | 'ProductImage' | 'Category' | 'Offer' | 'InventoryItem';
  dbField: string;
  transform?: (value: string, options?: any) => any;
  exportTransform?: (value: any) => string;
  required?: boolean;
}

/**
 * Category type enumeration
 */
export enum CPICategoryType {
  EBAY = 'EBAY',
  GOOGLE = 'GOOGLE',
  PRODUCT_TYPE = 'PRODUCT_TYPE'
}

/**
 * Product condition enumeration (eBay standard)
 */
export enum CPICondition {
  NEW = 'New',
  NEW_OTHER = 'New other',
  NEW_WITH_DEFECTS = 'New with defects',
  MANUFACTURER_REFURBISHED = 'Manufacturer refurbished',
  SELLER_REFURBISHED = 'Seller refurbished',
  USED = 'Used',
  VERY_GOOD = 'Very Good',
  GOOD = 'Good',
  ACCEPTABLE = 'Acceptable',
  FOR_PARTS = 'For parts or not working'
}

/**
 * Weight units supported
 */
export type WeightUnit = 'g' | 'kg' | 'lb' | 'oz';

/**
 * Length units supported
 */
export type LengthUnit = 'cm' | 'mm' | 'in' | 'ft';

/**
 * Validation result for a CPI row
 */
export interface CPIValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  invalidTypes: Record<string, string>;
}
