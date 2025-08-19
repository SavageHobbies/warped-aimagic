"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductExtractor = void 0;
// Simple product extractor for eBay listings
const cheerio = __importStar(require("cheerio"));
const utils_1 = require("../utils");
class ProductExtractor {
    async extractProductDetails(content) {
        const $ = cheerio.load(content.html);
        // Extract all product details using multiple strategies
        const title = this.extractTitle($);
        const description = this.extractDescription($);
        const price = this.extractPrice($);
        const condition = this.extractCondition($);
        const images = await this.extractImages($);
        const specifications = this.extractSpecifications($);
        const seller = this.extractSeller($);
        const location = this.extractLocation($);
        const productDetails = {
            title,
            description,
            price,
            condition,
            images,
            specifications,
            seller,
            location
        };
        // Validate completeness and attempt fallback extraction if needed
        if (!(0, utils_1.validateProductDetails)(productDetails)) {
            return this.attemptFallbackExtraction($, productDetails);
        }
        return productDetails;
    }
    extractTitle($) {
        const titleSelectors = [
            'h1[data-testid="x-item-title-label"]',
            'h1#x-item-title-label',
            'h1.it-ttl',
            'h1.notranslate',
            '.x-item-title-label',
            'h1[id*="title"]',
            'h1:first',
            'h2:first',
            'h3:first'
        ];
        for (const selector of titleSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                let title = element.text().trim();
                // Clean up title text
                title = title.replace(/^Details about\s*/i, '');
                title = title.replace(/\s+/g, ' ');
                if (title && title.length > 5) {
                    return title;
                }
            }
        }
        // Extract from page title as last resort
        const pageTitle = $('title').text().trim();
        if (pageTitle) {
            return pageTitle.replace(/\s*\|\s*eBay.*$/i, '').trim();
        }
        return '';
    }
    extractDescription($) {
        const descriptionSelectors = [
            '[data-testid="ux-layout-section-evo"]',
            '#desc_div',
            '.u-flL.condText',
            '[data-testid="item-description"]',
            '.item-description',
            '#viTabs_0_is',
            '.section-title + div'
        ];
        let description = '';
        for (const selector of descriptionSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const text = element.text().trim();
                if (text && text.length > description.length) {
                    description = text;
                }
            }
        }
        // Clean up description
        description = description.replace(/\s+/g, ' ').trim();
        // If description is too short, try to extract from multiple elements
        if (description.length < 50) {
            const additionalText = this.extractAdditionalDescription($);
            if (additionalText.length > description.length) {
                description = additionalText;
            }
        }
        return description;
    }
    extractAdditionalDescription($) {
        const textElements = [];
        $('p, div[class*="description"], div[class*="detail"], .item-condition-text').each((_, element) => {
            let text = $(element).text().trim();
            text = text.replace(/\s+/g, ' ');
            if (text && text.length > 20 && !textElements.includes(text)) {
                textElements.push(text);
            }
        });
        return textElements.join(' ').substring(0, 1000);
    }
    extractPrice($) {
        const priceSelectors = [
            '[data-testid="notranslate"]',
            '.x-price-primary',
            '.u-flL.notranslate',
            '[data-testid="x-price-primary"]',
            '.price-current',
            '.vi-price .notranslate',
            '.u-flL:contains("$")',
            '[class*="price"]'
        ];
        for (const selector of priceSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const priceText = element.text().trim();
                const price = (0, utils_1.formatPrice)(priceText);
                if (price > 0) {
                    return price;
                }
            }
        }
        // Try to find price in any element containing currency symbols
        $('*').each((_, element) => {
            const text = $(element).text().trim();
            if (text.match(/[\$£€¥][\d,]+\.?\d*/)) {
                const price = (0, utils_1.formatPrice)(text);
                if (price > 0) {
                    return false; // Break the loop
                }
            }
        });
        // Try to find price in any text content
        const priceRegex = /[\$£€¥][\s]*[\d,]+\.?\d*/g;
        const bodyText = $('body').text();
        const priceMatches = bodyText.match(priceRegex);
        if (priceMatches && priceMatches.length > 0) {
            // Return the first valid price found
            for (const match of priceMatches) {
                const price = (0, utils_1.formatPrice)(match);
                if (price > 0) {
                    return price;
                }
            }
        }
        return 0;
    }
    extractCondition($) {
        const conditionSelectors = [
            '[data-testid="u-flL condText"]',
            '.u-flL.condText',
            '.condition-text',
            '[class*="condition"]',
            '.item-condition'
        ];
        for (const selector of conditionSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const condition = element.text().trim();
                if (condition && this.isValidCondition(condition)) {
                    return condition;
                }
            }
        }
        // Look for condition in any text content
        const bodyText = $('body').text().toLowerCase();
        const conditionPatterns = [
            { pattern: /brand new|new with tags|new in box/i, condition: 'Brand New' },
            { pattern: /like new|excellent condition/i, condition: 'Like New' },
            { pattern: /very good|good condition/i, condition: 'Very Good' },
            { pattern: /used|pre-owned|previously owned/i, condition: 'Used' },
            { pattern: /refurbished|renewed/i, condition: 'Refurbished' },
            { pattern: /open box|opened/i, condition: 'Open Box' },
            { pattern: /for parts|not working|broken/i, condition: 'For Parts' },
            { pattern: /excellent/i, condition: 'Excellent' },
            { pattern: /good/i, condition: 'Good' },
            { pattern: /\bnew\b/i, condition: 'New' }
        ];
        for (const { pattern, condition } of conditionPatterns) {
            if (pattern.test(bodyText)) {
                return condition;
            }
        }
        return 'Unknown';
    }
    isValidCondition(condition) {
        const validConditions = [
            'new', 'used', 'refurbished', 'open box', 'for parts',
            'brand new', 'like new', 'very good', 'good', 'acceptable'
        ];
        return validConditions.some(valid => condition.toLowerCase().includes(valid.toLowerCase()));
    }
    async extractImages($) {
        // Extract title for potential UPC lookup
        const title = this.extractTitle($);
        // Try to find UPC in the page content
        const upcMatch = this.extractUPCFromContent($, title);
        const upc = upcMatch ? upcMatch[0] : undefined;
        utils_1.logger.info(`Extracted UPC: ${upc || 'No UPC found'}`);
        // Extract the main image
        const mainImage = this.extractMainImage($);
        if (mainImage) {
            utils_1.logger.info(`✅ Found main image: ${mainImage.url}`);
            return [mainImage];
        }
        utils_1.logger.warn('No main image found, using placeholder');
        // Final fallback: return a placeholder image
        return [{
                url: 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Product+Image',
                altText: title || 'Product Image',
                size: 'large',
                isValid: true
            }];
    }
    extractMainImage($) {
        // Main image selectors in order of priority
        const mainImageSelectors = [
            'img[data-testid="ux-image-carousel-item"]',
            'img[data-zoom-src]',
            '#icImg',
            '#image',
            '.img img',
            '.image img',
            'img[src*="ebayimg.com"]:first',
            'img[src*="i.ebayimg.com"]:first'
        ];
        for (const selector of mainImageSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const $img = $(element);
                // Try multiple attributes for image URL
                const possibleUrls = [
                    $img.attr('data-zoom-src'),
                    $img.attr('data-src'),
                    $img.attr('src')
                ].filter(Boolean);
                for (const url of possibleUrls) {
                    if (url && this.isValidImageUrl(url)) {
                        // Convert to high-resolution URL if possible
                        const highResUrl = this.convertToHighResolution(url);
                        return {
                            url: highResUrl,
                            altText: $img.attr('alt') || undefined,
                            size: this.determineImageSize(highResUrl),
                            isValid: true
                        };
                    }
                }
            }
        }
        return null;
    }
    extractUPCFromContent($, title) {
        // Strategy 1: Look for UPC in the title
        let upcMatch = title.match(/\b\d{12,13}\b/);
        if (upcMatch) {
            return upcMatch;
        }
        // Strategy 2: Look for UPC in item specifics
        const itemSpecifics = this.extractSpecifications($);
        const specificValues = Object.values(itemSpecifics).join(' ');
        upcMatch = specificValues.match(/\b\d{12,13}\b/);
        if (upcMatch) {
            return upcMatch;
        }
        // Strategy 3: Look for UPC in description
        const description = this.extractDescription($);
        upcMatch = description.match(/\b\d{12,13}\b/);
        if (upcMatch) {
            return upcMatch;
        }
        // Strategy 4: Look for UPC in any text content
        const bodyText = $('body').text();
        upcMatch = bodyText.match(/\b\d{12,13}\b/);
        if (upcMatch) {
            return upcMatch;
        }
        return null;
    }
    isValidImageUrl(url) {
        if (!url || url.length < 10)
            return false;
        // Check for common image extensions and eBay image patterns
        const imagePatterns = [
            /\.(jpg|jpeg|png|gif|webp)(\?|$)/i,
            /ebayimg\.com/,
            /i\.ebayimg\.com/,
            /thumbs\d*\.ebaystatic\.com/
        ];
        return imagePatterns.some(pattern => pattern.test(url));
    }
    convertToHighResolution(url) {
        // eBay image URL patterns for high resolution
        if (url.includes('ebayimg.com')) {
            // Convert to largest size available
            return url
                .replace(/\/s-l\d+\./, '/s-l1600.')
                .replace(/\/s-l\d+$/, '/s-l1600.jpg')
                .replace(/\$_\d+\./, '$_57.')
                .replace(/\$_\w+\./, '$_57.');
        }
        // For other image hosts, return as-is
        return url;
    }
    determineImageSize(url) {
        // eBay size patterns
        if (url.includes('s-l1600') || url.includes('s-l1200') || url.includes('s-l800')) {
            return 'large';
        }
        if (url.includes('s-l400') || url.includes('s-l300') || url.includes('s-l225')) {
            return 'medium';
        }
        if (url.includes('s-l64') || url.includes('s-l96') || url.includes('s-l140')) {
            return 'thumbnail';
        }
        // Generic size detection based on URL patterns
        if (url.includes('thumb') || url.includes('small')) {
            return 'thumbnail';
        }
        if (url.includes('large') || url.includes('big') || url.includes('full')) {
            return 'large';
        }
        // Default to medium if can't determine
        return 'medium';
    }
    extractSpecifications($) {
        const specifications = {};
        // Modern item specifics
        $('[data-testid="ux-labels-values"] dt, [data-testid="ux-labels-values"] dd').each((index, element) => {
            const text = $(element).text().trim();
            if (index % 2 === 0) {
                // This is a label (dt)
                const nextElement = $(element).next();
                if (nextElement.length > 0) {
                    const value = nextElement.text().trim();
                    if (text && value) {
                        specifications[text.replace(':', '')] = value;
                    }
                }
            }
        });
        // Classic item specifics table
        $('.itemAttr tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
                const key = $(cells[0]).text().trim().replace(':', '');
                const value = $(cells[1]).text().trim();
                if (key && value) {
                    specifications[key] = value;
                }
            }
        });
        // Generic key-value pairs
        $('dt, th').each((_, element) => {
            const key = $(element).text().trim().replace(':', '');
            const valueElement = $(element).next('dd, td');
            if (valueElement.length > 0) {
                const value = valueElement.text().trim();
                if (key && value && key.length < 50 && value.length < 200) {
                    specifications[key] = value;
                }
            }
        });
        return specifications;
    }
    extractSeller($) {
        const sellerSelectors = [
            '[data-testid="x-sellercard-atf"] a',
            '.seller-persona a',
            '.mbg-nw',
            '[data-testid="seller-link"]',
            'a[href*="/usr/"]'
        ];
        for (const selector of sellerSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const seller = element.text().trim();
                if (seller && seller.length > 0 && seller.length < 50) {
                    return seller;
                }
            }
        }
        return 'Unknown Seller';
    }
    extractLocation($) {
        const locationSelectors = [
            '[data-testid="ux-textspans"]',
            '.vi-acc-del-range',
            '.location-text',
            '[class*="location"]',
            '.ship-from'
        ];
        for (const selector of locationSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const location = element.text().trim();
                if (location && this.isValidLocation(location)) {
                    return location;
                }
            }
        }
        // Fallback: look for location patterns in any div or span
        const locationPatterns = [
            /\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b/,
            /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/,
            /Ships from\s+([^,]+,\s*[^,]+)/i,
            /Located in\s+([^,]+,\s*[^,]+)/i
        ];
        const bodyText = $('body').text();
        for (const pattern of locationPatterns) {
            const match = bodyText.match(pattern);
            if (match) {
                const location = match[1] || match[0];
                if (this.isValidLocation(location)) {
                    return location.trim();
                }
            }
        }
        // Look for any div containing location-like text
        let foundLocation = '';
        $('div, span').each((_, element) => {
            const text = $(element).text().trim();
            if (text.match(/^[A-Z][a-z]+,\s*[A-Z][a-z]+$/) || text.match(/^[A-Z][a-z]+,\s*[A-Z]{2}$/)) {
                if (this.isValidLocation(text)) {
                    foundLocation = text;
                    return false; // Break the loop
                }
            }
        });
        if (foundLocation) {
            return foundLocation;
        }
        return 'Unknown Location';
    }
    isValidLocation(location) {
        // Basic validation for location format
        return location.length > 2 &&
            location.length < 100 &&
            !/^\d+$/.test(location) && // Not just numbers
            !location.toLowerCase().includes('shipping');
    }
    async attemptFallbackExtraction($, partialDetails) {
        const result = { ...partialDetails };
        // Fallback title extraction
        if (!result.title) {
            result.title = this.extractFallbackTitle($);
        }
        // Fallback description extraction
        if (!result.description) {
            result.description = this.extractFallbackDescription($);
        }
        // Fallback price extraction
        if (result.price === 0) {
            result.price = this.extractFallbackPrice($);
        }
        // Fallback condition extraction
        if (!result.condition || result.condition === 'Unknown') {
            result.condition = this.extractFallbackCondition($);
        }
        // Fallback image extraction if no images found
        if (!result.images || result.images.length === 0) {
            const mainImage = this.extractMainImage($);
            if (mainImage) {
                result.images = [mainImage];
            }
            else {
                result.images = [{
                        url: 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Product+Image',
                        altText: result.title || 'Product Image',
                        size: 'large',
                        isValid: true
                    }];
            }
        }
        return result;
    }
    extractFallbackTitle($) {
        // Try meta tags
        const metaTitle = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="title"]').attr('content');
        if (metaTitle && metaTitle.trim().length > 5) {
            return metaTitle.trim();
        }
        // Try any heading element
        const headings = $('h1, h2, h3').first().text().trim();
        if (headings && headings.length > 5) {
            return headings;
        }
        return 'Unknown Product';
    }
    extractFallbackDescription($) {
        // Try meta description
        const metaDesc = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content');
        if (metaDesc && metaDesc.trim().length > 20) {
            return metaDesc.trim();
        }
        // Try to extract from any paragraph or div with substantial text
        let longestText = '';
        $('p, div').each((_, element) => {
            const text = $(element).text().trim();
            if (text.length > longestText.length && text.length > 50) {
                longestText = text;
            }
        });
        return longestText || 'No description available';
    }
    extractFallbackPrice($) {
        // Look for any element containing currency symbols
        const currencyElements = $('*:contains("$"), *:contains("£"), *:contains("€")');
        for (let i = 0; i < currencyElements.length; i++) {
            const element = currencyElements.eq(i);
            const text = element.text().trim();
            const price = (0, utils_1.formatPrice)(text);
            if (price > 0) {
                return price;
            }
        }
        return 0;
    }
    extractFallbackCondition($) {
        const bodyText = $('body').text().toLowerCase();
        const conditionPatterns = [
            { pattern: /brand new|new with tags|new in box/i, condition: 'Brand New' },
            { pattern: /like new|excellent condition/i, condition: 'Like New' },
            { pattern: /very good|good condition/i, condition: 'Very Good' },
            { pattern: /used|pre-owned|previously owned/i, condition: 'Used' },
            { pattern: /refurbished|renewed/i, condition: 'Refurbished' },
            { pattern: /open box|opened/i, condition: 'Open Box' },
            { pattern: /for parts|not working|broken/i, condition: 'For Parts' }
        ];
        for (const { pattern, condition } of conditionPatterns) {
            if (pattern.test(bodyText)) {
                return condition;
            }
        }
        return 'Used'; // Default fallback
    }
}
exports.ProductExtractor = ProductExtractor;
//# sourceMappingURL=ProductExtractor.js.map