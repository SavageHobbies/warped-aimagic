"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pipeline = void 0;
// Simple pipeline for eBay listing optimization
const WebScraper_1 = require("./services/WebScraper");
const ProductExtractor_1 = require("./services/ProductExtractor");
const MarketResearcher_1 = require("./services/MarketResearcher");
const ContentOptimizer_1 = require("./services/ContentOptimizer");
const TemplateRenderer_1 = require("./services/TemplateRenderer");
const utils_1 = require("./utils");
/**
 * Simple pipeline class that orchestrates the optimization process
 */
class Pipeline {
    constructor() {
        this.webScraper = new WebScraper_1.WebScraper();
        this.productExtractor = new ProductExtractor_1.ProductExtractor();
        this.marketResearcher = new MarketResearcher_1.MarketResearcher();
        this.contentOptimizer = new ContentOptimizer_1.ContentOptimizer();
        this.templateRenderer = new TemplateRenderer_1.TemplateRenderer();
    }
    /**
     * Processes an eBay URL through the complete optimization pipeline
     * @param url - The eBay URL to process
     * @param templatePath - Path to the HTML template file (currently unused)
     * @returns Promise containing the complete pipeline result
     */
    async process(url, templatePath) {
        utils_1.logger.info(`Starting pipeline processing for URL: ${url}`);
        try {
            // Step 1: Scrape webpage content
            utils_1.logger.info('Step 1: Scraping webpage content');
            const webpageContent = await this.webScraper.scrapeUrl(url);
            utils_1.logger.info(`Web scraping completed, content length: ${webpageContent.html.length}`);
            // Step 2: Extract product details
            utils_1.logger.info('Step 2: Extracting product details');
            const productDetails = await this.productExtractor.extractProductDetails(webpageContent);
            utils_1.logger.info(`Product extraction completed: ${productDetails.title}, $${productDetails.price}`);
            // Step 3: Conduct market research
            utils_1.logger.info('Step 3: Conducting market research');
            const researchData = await this.marketResearcher.conductResearch(productDetails);
            utils_1.logger.info(`Market research completed: ${researchData.similarListings.length} similar listings found`);
            // Step 4: Optimize content
            utils_1.logger.info('Step 4: Optimizing content');
            const optimizedContent = await this.contentOptimizer.optimizeContent(productDetails, researchData);
            utils_1.logger.info(`Content optimization completed: ${optimizedContent.optimizedTitle}`);
            // Step 5: Render template
            utils_1.logger.info('Step 5: Rendering template');
            const renderedHtml = await this.templateRenderer.renderTemplate(optimizedContent, productDetails, templatePath);
            utils_1.logger.info(`Template rendering completed: ${renderedHtml.length} characters`);
            const result = {
                originalDetails: productDetails,
                optimizedContent,
                renderedHtml,
                researchData
            };
            utils_1.logger.info('Pipeline processing completed successfully');
            return result;
        }
        catch (error) {
            utils_1.logger.error('Pipeline processing failed', error);
            throw new Error(`Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.Pipeline = Pipeline;
//# sourceMappingURL=pipeline.js.map