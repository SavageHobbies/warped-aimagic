// Simple web scraper for eBay listings
import axios from 'axios';
import { WebpageContent } from '../models';
import { isValidEbayUrl, sanitizeUrl, logger } from '../utils';

export class WebScraper {
  private readonly timeout = 30000; // 30 seconds

  async scrapeUrl(url: string): Promise<WebpageContent> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    if (!isValidEbayUrl(url)) {
      throw new Error('Invalid eBay URL: URL must be from eBay domain');
    }

    const sanitizedUrl = sanitizeUrl(url);
    logger.info(`Scraping URL: ${sanitizedUrl}`);

    try {
      const response = await axios.get(sanitizedUrl, {
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
      const metadata: Record<string, string> = {};
      
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

    } catch (error: any) {
      logger.error(`Failed to scrape URL: ${sanitizedUrl}`, error);
      
      if (error.response?.status === 429) {
        throw new Error(`Rate limited: Please try again later`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout: The server took too long to respond`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`Network error: Unable to reach the server`);
      } else {
        throw new Error(`Failed to scrape URL: ${error.message}`);
      }
    }
  }
}
