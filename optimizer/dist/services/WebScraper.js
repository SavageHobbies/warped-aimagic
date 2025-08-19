"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebScraper = void 0;
// Simple web scraper for eBay listings
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils");
class WebScraper {
    constructor() {
        this.timeout = 30000; // 30 seconds
    }
    async scrapeUrl(url) {
        // Validate URL
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL: URL must be a non-empty string');
        }
        if (!(0, utils_1.isValidEbayUrl)(url)) {
            throw new Error('Invalid eBay URL: URL must be from eBay domain');
        }
        const sanitizedUrl = (0, utils_1.sanitizeUrl)(url);
        utils_1.logger.info(`Scraping URL: ${sanitizedUrl}`);
        try {
            const response = await axios_1.default.get(sanitizedUrl, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });
            if (!response.data || typeof response.data !== 'string') {
                throw new Error('Invalid response: Expected HTML content');
            }
            // Extract title from HTML
            const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : '';
            // Extract basic metadata
            const metadata = {};
            // Extract meta description
            const descMatch = response.data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (descMatch) {
                metadata.description = descMatch[1];
            }
            return {
                html: response.data,
                title,
                metadata,
                timestamp: new Date()
            };
        }
        catch (error) {
            utils_1.logger.error(`Failed to scrape URL: ${sanitizedUrl}`, error);
            if (error.response?.status === 429) {
                throw new Error(`Rate limited: Please try again later`);
            }
            else if (error.code === 'ECONNABORTED') {
                throw new Error(`Request timeout: The server took too long to respond`);
            }
            else if (error.code === 'ENOTFOUND') {
                throw new Error(`Network error: Unable to reach the server`);
            }
            else {
                throw new Error(`Failed to scrape URL: ${error.message}`);
            }
        }
    }
}
exports.WebScraper = WebScraper;
//# sourceMappingURL=WebScraper.js.map