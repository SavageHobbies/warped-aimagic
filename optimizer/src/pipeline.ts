// Simple pipeline for eBay listing optimization
import { WebScraper } from './services/WebScraper';
import { ProductExtractor } from './services/ProductExtractor';
import { MarketResearcher } from './services/MarketResearcher';
import { ContentOptimizer } from './services/ContentOptimizer';
import { TemplateRenderer } from './services/TemplateRenderer';
import { ProductDetails, OptimizedContent } from './models';
import { logger } from './utils';

export interface PipelineResult {
  originalDetails: ProductDetails;
  optimizedContent: OptimizedContent;
  renderedHtml: string;
  researchData?: any; // Market research data for detailed analysis
}

/**
 * Simple pipeline class that orchestrates the optimization process
 */
export class Pipeline {
  private webScraper: WebScraper;
  private productExtractor: ProductExtractor;
  private marketResearcher: MarketResearcher;
  private contentOptimizer: ContentOptimizer;
  private templateRenderer: TemplateRenderer;

  constructor() {
    this.webScraper = new WebScraper();
    this.productExtractor = new ProductExtractor();
    this.marketResearcher = new MarketResearcher();
    this.contentOptimizer = new ContentOptimizer();
    this.templateRenderer = new TemplateRenderer();
  }

  /**
   * Processes an eBay URL through the complete optimization pipeline
   * @param url - The eBay URL to process
   * @param templatePath - Path to the HTML template file (currently unused)
   * @returns Promise containing the complete pipeline result
   */
  async process(url: string, templatePath: string): Promise<PipelineResult> {
    logger.info(`Starting pipeline processing for URL: ${url}`);

    try {
      // Step 1: Scrape webpage content
      logger.info('Step 1: Scraping webpage content');
      const webpageContent = await this.webScraper.scrapeUrl(url);
      logger.info(`Web scraping completed, content length: ${webpageContent.html.length}`);

      // Step 2: Extract product details
      logger.info('Step 2: Extracting product details');
      const productDetails = await this.productExtractor.extractProductDetails(webpageContent);
      logger.info(`Product extraction completed: ${productDetails.title}, $${productDetails.price}`);

      // Step 3: Conduct market research
      logger.info('Step 3: Conducting market research');
      const researchData = await this.marketResearcher.conductResearch(productDetails);
      logger.info(`Market research completed: ${researchData.similarListings.length} similar listings found`);

      // Step 4: Optimize content
      logger.info('Step 4: Optimizing content');
      const optimizedContent = await this.contentOptimizer.optimizeContent(productDetails, researchData);
      logger.info(`Content optimization completed: ${optimizedContent.optimizedTitle}`);

      // Step 5: Render template
      logger.info('Step 5: Rendering template');
      const renderedHtml = await this.templateRenderer.renderTemplate(optimizedContent, productDetails, templatePath);
      logger.info(`Template rendering completed: ${renderedHtml.length} characters`);

      const result: PipelineResult = {
        originalDetails: productDetails,
        optimizedContent,
        renderedHtml,
        researchData
      };

      logger.info('Pipeline processing completed successfully');
      return result;

    } catch (error) {
      logger.error('Pipeline processing failed', error);
      throw new Error(`Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
