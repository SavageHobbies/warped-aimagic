// Utility functions for the simple eBay optimizer
import { ProductDetails } from './models';

// Simple validation functions
export function isValidEbayUrl(url: string): boolean {
  return url.includes('ebay.com') && url.includes('/itm/');
}

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  // Basic URL validation
  if (!url.match(/^https?:\/\//)) {
    return '';
  }
  
  // Force HTTPS for security
  return url.replace(/^http:\/\//, 'https://');
}

export function formatPrice(text: string): number {
  if (!text) return 0;
  
  // Extract price from text
  const priceMatch = text.match(/[\$£€¥][\s]*[\d,]+\.?\d*/);
  if (!priceMatch) return 0;
  
  // Clean and parse price
  const priceStr = priceMatch[0].replace(/[^\d.]/g, '');
  return parseFloat(priceStr) || 0;
}

export function validateProductDetails(details: ProductDetails): boolean {
  return !!(
    details.title && 
    details.title.trim().length > 0 &&
    details.description && 
    details.description.trim().length > 0 &&
    details.price > 0 &&
    details.condition && 
    details.condition.trim().length > 0
  );
}

// Simple logger
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  }
};

// Simple delay function
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
