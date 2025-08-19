import { ProductDetails, OptimizedContent } from './models';
export interface PipelineResult {
    originalDetails: ProductDetails;
    optimizedContent: OptimizedContent;
    renderedHtml: string;
    researchData?: any;
}
/**
 * Simple pipeline class that orchestrates the optimization process
 */
export declare class Pipeline {
    private webScraper;
    private productExtractor;
    private marketResearcher;
    private contentOptimizer;
    private templateRenderer;
    constructor();
    /**
     * Processes an eBay URL through the complete optimization pipeline
     * @param url - The eBay URL to process
     * @param templatePath - Path to the HTML template file (currently unused)
     * @returns Promise containing the complete pipeline result
     */
    process(url: string, templatePath: string): Promise<PipelineResult>;
}
//# sourceMappingURL=pipeline.d.ts.map