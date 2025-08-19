"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.isValidEbayUrl = isValidEbayUrl;
exports.sanitizeUrl = sanitizeUrl;
exports.formatPrice = formatPrice;
exports.validateProductDetails = validateProductDetails;
exports.delay = delay;
// Simple validation functions
function isValidEbayUrl(url) {
    return url.includes('ebay.com') && url.includes('/itm/');
}
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string')
        return '';
    // Basic URL validation
    if (!url.match(/^https?:\/\//)) {
        return '';
    }
    // Force HTTPS for security
    return url.replace(/^http:\/\//, 'https://');
}
function formatPrice(text) {
    if (!text)
        return 0;
    // Extract price from text
    const priceMatch = text.match(/[\$£€¥][\s]*[\d,]+\.?\d*/);
    if (!priceMatch)
        return 0;
    // Clean and parse price
    const priceStr = priceMatch[0].replace(/[^\d.]/g, '');
    return parseFloat(priceStr) || 0;
}
function validateProductDetails(details) {
    return !!(details.title &&
        details.title.trim().length > 0 &&
        details.description &&
        details.description.trim().length > 0 &&
        details.price > 0 &&
        details.condition &&
        details.condition.trim().length > 0);
}
// Simple logger
exports.logger = {
    info: (message, data) => {
        console.log(`[INFO] ${message}`, data || '');
    },
    warn: (message, data) => {
        console.warn(`[WARN] ${message}`, data || '');
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error || '');
    }
};
// Simple delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=utils.js.map